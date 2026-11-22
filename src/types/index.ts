export type TransactionType = 'GAVE' | 'GOT';

export interface Party {
  id: string;
  name: string;
  phone?: string | null;
  created_at: number; // Unix timestamp in ms
  updated_at: number; // Unix timestamp in ms
  // Aggregated fields
  net_balance_paise?: number; // Positive = You will get (green), Negative = You will give (red)
  last_transaction_date?: number | null;
  transaction_count?: number;
}

export interface Transaction {
  id: string;
  party_id: string;
  type: TransactionType;
  amount_paise: number; // Strict integer paise
  note?: string | null;
  date: number; // Unix timestamp in ms
  created_at: number; // Unix timestamp in ms
}

export interface DashboardSummary {
  totalWillGetPaise: number; // Sum of positive balances (green #16A34A)
  totalWillGivePaise: number; // Sum of absolute negative balances (red #DC2626)
  netBalancePaise: number; // totalWillGet - totalWillGive
  totalParties: number;
}

export type AuthMode = 'guest' | 'google';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
}

export interface AuthState {
  mode: AuthMode | null;
  user: UserProfile | null;
  lastSyncedAt: number | null;
  isSyncing: boolean;
  syncError?: string | null;
}

export interface BackupPayload {
  version: number;
  exported_at: number;
  parties: Party[];
  transactions: Transaction[];
}
