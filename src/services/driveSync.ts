import { getNativeGoogleSignin } from './googleAuthNative';
import { exportAllData, restoreAllData } from '../db';
import { BackupPayload } from '../types';
import { getStoredAuthState, updateLastSyncedTimestamp } from './auth';
import { parseDriveError } from './driveDiagnostics';

export * from './driveDiagnostics';

const BACKUP_FILENAME = 'hisaab_backup.json';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: string | null;
}

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];
let currentSyncStatus: SyncStatus = {
  isSyncing: false,
  lastSyncedAt: null,
  error: null,
};

let autoBackupTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncStatusListeners.push(listener);
  listener(currentSyncStatus);
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== listener);
  };
}

function updateStatus(updates: Partial<SyncStatus>) {
  currentSyncStatus = { ...currentSyncStatus, ...updates };
  syncStatusListeners.forEach((l) => l(currentSyncStatus));
}



/**
 * Retrieves valid Google OAuth access token with support for force-refresh.
 */
export async function getAccessToken(forceRefresh = false): Promise<string | null> {
  try {
    const { isAvailable, GoogleSignin } = getNativeGoogleSignin();
    if (!isAvailable || !GoogleSignin) return null;

    if (forceRefresh) {
      try {
        const tokens = await GoogleSignin.getTokens();
        if (tokens?.accessToken && typeof GoogleSignin.clearCachedAccessToken === 'function') {
          await GoogleSignin.clearCachedAccessToken(tokens.accessToken);
        }
      } catch (err) {
        console.warn('Could not clear cached access token:', err);
      }

      try {
        if (typeof GoogleSignin.signInSilently === 'function') {
          await GoogleSignin.signInSilently();
        }
      } catch (err) {
        console.warn('Silent sign-in failed during token refresh:', err);
      }
    }

    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken || null;
  } catch (error) {
    console.warn('Failed to obtain Google access token:', error);
    return null;
  }
}

/**
 * Handles requesting missing drive.appdata scope or re-authenticating if required.
 */
export async function requestDriveScopeOrReauth(): Promise<string | null> {
  try {
    const { isAvailable, GoogleSignin } = getNativeGoogleSignin();
    if (!isAvailable || !GoogleSignin) return null;

    if (typeof GoogleSignin.addScopes === 'function') {
      try {
        await GoogleSignin.addScopes({
          scopes: ['https://www.googleapis.com/auth/drive.appdata'],
        });
      } catch (e) {
        console.warn('addScopes failed:', e);
      }
    }

    return await getAccessToken(true);
  } catch (error) {
    console.warn('Re-auth / scope request failed:', error);
    return null;
  }
}

/**
 * Searches for hisaab_backup.json in Google Drive appDataFolder.
 */
async function findBackupFileId(
  accessToken: string
): Promise<{ fileId: string | null; error?: string; status: number }> {
  const query = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
  const url = `${DRIVE_FILES_URL}?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errMsg = await parseDriveError(response, 'Drive search');
    return { fileId: null, error: errMsg, status: response.status };
  }

  const data = await response.json();
  const fileId = data.files && data.files.length > 0 ? data.files[0].id : null;
  return { fileId, status: response.status };
}

/**
 * Performs immediate backup to Google Drive appDataFolder.
 */
export async function performBackup(): Promise<{ success: boolean; error?: string }> {
  try {
    const authState = await getStoredAuthState();
    if (authState.mode !== 'google') {
      return { success: false, error: 'Backup is only enabled for Google accounts' };
    }

    updateStatus({ isSyncing: true, error: null });

    let accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Google authentication session expired. Please sign in again.');
    }

    // 1. Export local SQLite to compact JSON snapshot
    const payload: BackupPayload = await exportAllData();
    const jsonContent = JSON.stringify(payload);

    // 2. Check if backup file already exists in appDataFolder
    let searchResult = await findBackupFileId(accessToken);

    // If token expired (401) or scope missing (403), attempt token refresh / reauth once
    if (searchResult.error && (searchResult.status === 401 || searchResult.status === 403)) {
      if (searchResult.error.includes('Missing Google Drive AppData permissions')) {
        const reauthedToken = await requestDriveScopeOrReauth();
        if (reauthedToken) {
          accessToken = reauthedToken;
          searchResult = await findBackupFileId(accessToken);
        }
      } else if (searchResult.status === 401) {
        const refreshedToken = await getAccessToken(true);
        if (refreshedToken) {
          accessToken = refreshedToken;
          searchResult = await findBackupFileId(accessToken);
        }
      }
    }

    if (searchResult.error) {
      throw new Error(searchResult.error);
    }

    const existingFileId = searchResult.fileId;

    if (existingFileId) {
      // Overwrite existing file via PATCH media
      const patchUrl = `${DRIVE_UPLOAD_URL}/${existingFileId}?uploadType=media`;
      const response = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: jsonContent,
      });

      if (!response.ok) {
        const errMsg = await parseDriveError(response, 'Updating backup file');
        throw new Error(errMsg);
      }
    } else {
      // Create new file via multipart upload in appDataFolder
      const boundary = 'hisaab_multipart_boundary';
      const metadata = JSON.stringify({
        name: BACKUP_FILENAME,
        parents: ['appDataFolder'],
      });

      const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${metadata}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        `${jsonContent}\r\n` +
        `--${boundary}--`;

      const postUrl = `${DRIVE_UPLOAD_URL}?uploadType=multipart`;
      const response = await fetch(postUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
      });

      if (!response.ok) {
        const errMsg = await parseDriveError(response, 'Creating backup file');
        throw new Error(errMsg);
      }
    }

    const now = Date.now();
    await updateLastSyncedTimestamp(now);
    updateStatus({ isSyncing: false, lastSyncedAt: now, error: null });

    return { success: true };
  } catch (error: any) {
    const errorMsg = error?.message || 'Drive backup failed';
    console.error('Backup error:', errorMsg);
    updateStatus({ isSyncing: false, error: errorMsg });
    return { success: false, error: errorMsg };
  }
}

/**
 * Triggers debounced 3s auto-backup when database changes.
 * Only executes if signed in with Google.
 */
export function triggerDebouncedAutoBackup(): void {
  if (autoBackupTimer) {
    clearTimeout(autoBackupTimer);
  }

  autoBackupTimer = setTimeout(async () => {
    try {
      const auth = await getStoredAuthState();
      if (auth.mode === 'google') {
        await performBackup();
      }
    } catch (e) {
      console.warn('Debounced backup error:', e);
    }
  }, 3000);
}

/**
 * Restores local SQLite from Google Drive backup if one exists.
 * Used during cross-device sign-in or manual restore.
 */
export async function restoreFromDrive(): Promise<{
  success: boolean;
  restored: boolean;
  recordCount?: { parties: number; transactions: number };
  error?: string;
}> {
  try {
    const authState = await getStoredAuthState();
    if (authState.mode !== 'google') {
      return { success: false, restored: false, error: 'User is not signed in with Google' };
    }

    updateStatus({ isSyncing: true, error: null });

    let accessToken = await getAccessToken();
    if (!accessToken) {
      throw new Error('Google authentication session expired.');
    }

    let searchResult = await findBackupFileId(accessToken);

    // If token expired (401) or scope missing (403), attempt token refresh / reauth once
    if (searchResult.error && (searchResult.status === 401 || searchResult.status === 403)) {
      if (searchResult.error.includes('Missing Google Drive AppData permissions')) {
        const reauthedToken = await requestDriveScopeOrReauth();
        if (reauthedToken) {
          accessToken = reauthedToken;
          searchResult = await findBackupFileId(accessToken);
        }
      } else if (searchResult.status === 401) {
        const refreshedToken = await getAccessToken(true);
        if (refreshedToken) {
          accessToken = refreshedToken;
          searchResult = await findBackupFileId(accessToken);
        }
      }
    }

    if (searchResult.error) {
      throw new Error(searchResult.error);
    }

    const fileId = searchResult.fileId;
    if (!fileId) {
      updateStatus({ isSyncing: false, error: null });
      return { success: true, restored: false }; // No remote backup yet
    }

    // Download backup file
    const downloadUrl = `${DRIVE_FILES_URL}/${fileId}?alt=media`;
    const response = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errMsg = await parseDriveError(response, 'Downloading backup file');
      throw new Error(errMsg);
    }

    const payload: BackupPayload = await response.json();

    if (!payload || !Array.isArray(payload.parties)) {
      throw new Error('Invalid backup file format');
    }

    // Restore to SQLite
    await restoreAllData(payload);

    const now = Date.now();
    await updateLastSyncedTimestamp(now);
    updateStatus({ isSyncing: false, lastSyncedAt: now, error: null });

    return {
      success: true,
      restored: true,
      recordCount: {
        parties: payload.parties.length,
        transactions: payload.transactions ? payload.transactions.length : 0,
      },
    };
  } catch (error: any) {
    const errorMsg = error?.message || 'Restore failed';
    console.error('Restore error:', errorMsg);
    updateStatus({ isSyncing: false, error: errorMsg });
    return { success: false, restored: false, error: errorMsg };
  }
}
