import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import {
  Transaction,
  TransactionType,
  DashboardSummary,
  BackupPayload,
  Party,
} from '../types';

export async function createTransaction(
  partyId: string,
  type: TransactionType,
  amountPaise: number,
  note?: string | null,
  date?: number
): Promise<Transaction> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = Date.now();
  const txDate = date || now;
  const cleanAmount = Math.max(0, Math.round(amountPaise));
  const trimmedNote = note ? note.trim() : null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO transactions (id, party_id, type, amount_paise, note, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, partyId, type, cleanAmount, trimmedNote, txDate, now]
    );

    // Update party's updated_at
    await db.runAsync(`UPDATE parties SET updated_at = ? WHERE id = ?`, [now, partyId]);
  });

  return {
    id,
    party_id: partyId,
    type,
    amount_paise: cleanAmount,
    note: trimmedNote,
    date: txDate,
    created_at: now,
  };
}

export async function updateTransaction(
  id: string,
  type: TransactionType,
  amountPaise: number,
  note?: string | null,
  date?: number
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  const cleanAmount = Math.max(0, Math.round(amountPaise));
  const trimmedNote = note ? note.trim() : null;

  await db.withTransactionAsync(async () => {
    // Get party_id first to update party.updated_at
    const tx = await db.getFirstAsync<{ party_id: string }>(
      `SELECT party_id FROM transactions WHERE id = ?`,
      [id]
    );

    let query = `UPDATE transactions SET type = ?, amount_paise = ?, note = ?`;
    const params: (string | number | null)[] = [type, cleanAmount, trimmedNote];

    if (date !== undefined) {
      query += `, date = ?`;
      params.push(date);
    }
    query += ` WHERE id = ?`;
    params.push(id);

    await db.runAsync(query, params);

    if (tx?.party_id) {
      await db.runAsync(`UPDATE parties SET updated_at = ? WHERE id = ?`, [now, tx.party_id]);
    }
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    const tx = await db.getFirstAsync<{ party_id: string }>(
      `SELECT party_id FROM transactions WHERE id = ?`,
      [id]
    );

    await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);

    if (tx?.party_id) {
      await db.runAsync(`UPDATE parties SET updated_at = ? WHERE id = ?`, [now, tx.party_id]);
    }
  });
}

export async function getTransactionsForParty(partyId: string): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Transaction>(
    `SELECT id, party_id, type, amount_paise, note, date, created_at
     FROM transactions
     WHERE party_id = ?
     ORDER BY date ASC, created_at ASC`,
    [partyId]
  );
  return rows;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = await getDatabase();

  interface SummaryRow {
    total_parties: number;
    total_will_get: number;
    total_will_give: number;
  }

  const row = await db.getFirstAsync<SummaryRow>(`
    WITH party_balances AS (
      SELECT 
        p.id,
        COALESCE(SUM(CASE WHEN t.type = 'GAVE' THEN t.amount_paise ELSE -t.amount_paise END), 0) AS balance
      FROM parties p
      LEFT JOIN transactions t ON p.id = t.party_id
      GROUP BY p.id
    )
    SELECT 
      COUNT(*) AS total_parties,
      COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) AS total_will_get,
      COALESCE(SUM(CASE WHEN balance < 0 THEN -balance ELSE 0 END), 0) AS total_will_give
    FROM party_balances;
  `);

  const totalWillGet = row?.total_will_get ?? 0;
  const totalWillGive = row?.total_will_give ?? 0;

  return {
    totalWillGetPaise: totalWillGet,
    totalWillGivePaise: totalWillGive,
    netBalancePaise: totalWillGet - totalWillGive,
    totalParties: row?.total_parties ?? 0,
  };
}

export async function exportAllData(): Promise<BackupPayload> {
  const db = await getDatabase();
  const parties = await db.getAllAsync<Party>(`SELECT * FROM parties ORDER BY created_at ASC`);
  const transactions = await db.getAllAsync<Transaction>(`SELECT * FROM transactions ORDER BY created_at ASC`);

  return {
    version: 1,
    exported_at: Date.now(),
    parties,
    transactions,
  };
}

export async function restoreAllData(payload: BackupPayload): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    // Clear existing
    await db.runAsync(`DELETE FROM transactions`);
    await db.runAsync(`DELETE FROM parties`);

    // Insert parties
    if (payload.parties && payload.parties.length > 0) {
      for (const p of payload.parties) {
        await db.runAsync(
          `INSERT INTO parties (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          [p.id, p.name, p.phone || null, p.created_at, p.updated_at]
        );
      }
    }

    // Insert transactions
    if (payload.transactions && payload.transactions.length > 0) {
      for (const t of payload.transactions) {
        await db.runAsync(
          `INSERT INTO transactions (id, party_id, type, amount_paise, note, date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [t.id, t.party_id, t.type, t.amount_paise, t.note || null, t.date, t.created_at]
        );
      }
    }
  });
}
