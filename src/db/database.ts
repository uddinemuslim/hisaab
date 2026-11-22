import * as SQLite from 'expo-sqlite';
import {
  CREATE_PARTIES_TABLE,
  CREATE_TRANSACTIONS_TABLE,
  CREATE_INDEX_PARTY_ID,
  CREATE_INDEX_DATE,
} from './schema';

const DB_NAME = 'hisaab.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Initializes and returns the SQLite database instance.
 * Ensures WAL mode, Foreign Keys, and Tables are created.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode and foreign key constraints
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Execute schema definitions
  await db.execAsync(`
    ${CREATE_PARTIES_TABLE}
    ${CREATE_TRANSACTIONS_TABLE}
    ${CREATE_INDEX_PARTY_ID}
    ${CREATE_INDEX_DATE}
  `);

  dbInstance = db;
  return dbInstance;
}

/**
 * Closes and resets the database instance (useful for testing or full restore).
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
