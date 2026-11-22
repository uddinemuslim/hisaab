/**
 * SQLite Database Schema and Tables for HISAAB.
 * Strictly adheres to specifications:
 * - parties: (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, created_at INTEGER, updated_at INTEGER)
 * - transactions: (id TEXT PRIMARY KEY, party_id TEXT NOT NULL, type TEXT CHECK (type IN ('GAVE', 'GOT')),
 *                  amount_paise INTEGER NOT NULL, note TEXT, date INTEGER NOT NULL, created_at INTEGER)
 */

export const CREATE_PARTIES_TABLE = `
CREATE TABLE IF NOT EXISTS parties (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  party_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('GAVE', 'GOT')),
  amount_paise INTEGER NOT NULL,
  note TEXT,
  date INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (party_id) REFERENCES parties (id) ON DELETE CASCADE
);
`;

export const CREATE_INDEX_PARTY_ID = `
CREATE INDEX IF NOT EXISTS idx_transactions_party_id ON transactions (party_id);
`;

export const CREATE_INDEX_DATE = `
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
`;
