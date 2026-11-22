import * as Crypto from 'expo-crypto';
import { getDatabase } from './database';
import { Party } from '../types';

export async function createParty(name: string, phone?: string | null): Promise<Party> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  const now = Date.now();
  const trimmedName = name.trim();
  const trimmedPhone = phone ? phone.trim() : null;

  await db.runAsync(
    `INSERT INTO parties (id, name, phone, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [id, trimmedName, trimmedPhone, now, now]
  );

  return {
    id,
    name: trimmedName,
    phone: trimmedPhone,
    created_at: now,
    updated_at: now,
    net_balance_paise: 0,
    last_transaction_date: null,
    transaction_count: 0,
  };
}

export async function updateParty(id: string, name: string, phone?: string | null): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  const trimmedName = name.trim();
  const trimmedPhone = phone ? phone.trim() : null;

  await db.runAsync(
    `UPDATE parties SET name = ?, phone = ?, updated_at = ? WHERE id = ?`,
    [trimmedName, trimmedPhone, now, id]
  );
}

export async function deleteParty(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`DELETE FROM parties WHERE id = ?`, [id]);
}

export async function getPartyById(id: string): Promise<Party | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Party>(
    `SELECT 
       p.id,
       p.name,
       p.phone,
       p.created_at,
       p.updated_at,
       COALESCE(SUM(CASE WHEN t.type = 'GAVE' THEN t.amount_paise ELSE -t.amount_paise END), 0) AS net_balance_paise,
       MAX(t.date) AS last_transaction_date,
       COUNT(t.id) AS transaction_count
     FROM parties p
     LEFT JOIN transactions t ON p.id = t.party_id
     WHERE p.id = ?
     GROUP BY p.id`,
    [id]
  );
  return row || null;
}

export async function getPartiesWithBalances(searchQuery?: string): Promise<Party[]> {
  const db = await getDatabase();
  const cleanSearch = searchQuery ? searchQuery.trim() : '';

  if (cleanSearch) {
    const term = `%${cleanSearch}%`;
    const rows = await db.getAllAsync<Party>(
      `SELECT 
         p.id,
         p.name,
         p.phone,
         p.created_at,
         p.updated_at,
         COALESCE(SUM(CASE WHEN t.type = 'GAVE' THEN t.amount_paise ELSE -t.amount_paise END), 0) AS net_balance_paise,
         MAX(t.date) AS last_transaction_date,
         COUNT(t.id) AS transaction_count
       FROM parties p
       LEFT JOIN transactions t ON p.id = t.party_id
       WHERE p.name LIKE ? OR (p.phone IS NOT NULL AND p.phone LIKE ?)
       GROUP BY p.id
       ORDER BY 
         COALESCE(MAX(t.date), p.updated_at) DESC`,
      [term, term]
    );
    return rows;
  }

  const rows = await db.getAllAsync<Party>(
    `SELECT 
       p.id,
       p.name,
       p.phone,
       p.created_at,
       p.updated_at,
       COALESCE(SUM(CASE WHEN t.type = 'GAVE' THEN t.amount_paise ELSE -t.amount_paise END), 0) AS net_balance_paise,
       MAX(t.date) AS last_transaction_date,
       COUNT(t.id) AS transaction_count
     FROM parties p
     LEFT JOIN transactions t ON p.id = t.party_id
     GROUP BY p.id
     ORDER BY 
       COALESCE(MAX(t.date), p.updated_at) DESC`
  );
  return rows;
}
