import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AuthMode, AuthState, UserProfile } from '../types';

const KEY_AUTH_MODE = '@hisaab_auth_mode';
const KEY_USER_PROFILE = '@hisaab_user_profile';
const KEY_LAST_SYNCED = '@hisaab_last_synced';

let isConfigured = false;

export function configureGoogleSignIn(): void {
  if (isConfigured) return;
  try {
    GoogleSignin.configure({
      scopes: [
        'https://www.googleapis.com/auth/drive.appdata',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      // offlineAccess: true allows obtaining server auth code/refresh tokens
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
    isConfigured = true;
  } catch (err) {
    console.warn('GoogleSignin configuration error:', err);
  }
}

/**
 * Loads current saved authentication state from AsyncStorage.
 */
export async function getStoredAuthState(): Promise<AuthState> {
  try {
    const [modeVal, userVal, syncedVal] = await Promise.all([
      AsyncStorage.getItem(KEY_AUTH_MODE),
      AsyncStorage.getItem(KEY_USER_PROFILE),
      AsyncStorage.getItem(KEY_LAST_SYNCED),
    ]);

    const mode = (modeVal as AuthMode) || null;
    const user: UserProfile | null = userVal ? JSON.parse(userVal) : null;
    const lastSyncedAt = syncedVal ? parseInt(syncedVal, 10) : null;

    return {
      mode,
      user,
      lastSyncedAt,
      isSyncing: false,
      syncError: null,
    };
  } catch (error) {
    console.error('Failed to load auth state:', error);
    return {
      mode: null,
      user: null,
      lastSyncedAt: null,
      isSyncing: false,
      syncError: null,
    };
  }
}

/**
 * Sign in as Guest.
 * Local SQLite operates normally, cloud sync remains disabled.
 */
export async function signInAsGuest(): Promise<AuthState> {
  await AsyncStorage.setItem(KEY_AUTH_MODE, 'guest');
  await AsyncStorage.removeItem(KEY_USER_PROFILE);

  return {
    mode: 'guest',
    user: null,
    lastSyncedAt: null,
    isSyncing: false,
    syncError: null,
  };
}

/**
 * Sign in with Google account.
 */
export async function signInWithGoogle(): Promise<{ success: boolean; authState?: AuthState; error?: string }> {
  try {
    configureGoogleSignIn();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    const signInResult = await GoogleSignin.signIn();
    
    // In newer versions of @react-native-google-signin/google-signin,
    // response can be in data or direct object
    const userObj = (signInResult as any).data?.user || (signInResult as any).user;
    
    if (!userObj) {
      throw new Error('Could not retrieve user info from Google');
    }

    const profile: UserProfile = {
      id: userObj.id || userObj.email,
      name: userObj.name || userObj.givenName || 'Google User',
      email: userObj.email,
      photoUrl: userObj.photo || null,
    };

    await AsyncStorage.setItem(KEY_AUTH_MODE, 'google');
    await AsyncStorage.setItem(KEY_USER_PROFILE, JSON.stringify(profile));

    const syncedVal = await AsyncStorage.getItem(KEY_LAST_SYNCED);
    const lastSyncedAt = syncedVal ? parseInt(syncedVal, 10) : null;

    return {
      success: true,
      authState: {
        mode: 'google',
        user: profile,
        lastSyncedAt,
        isSyncing: false,
        syncError: null,
      },
    };
  } catch (error: any) {
    console.warn('Google sign-in error:', error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: 'Sign-in was cancelled' };
    } else if (error.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Sign-in already in progress' };
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, error: 'Google Play Services not available or outdated' };
    }
    return { success: false, error: error.message || 'Google sign-in failed' };
  }
}

/**
 * Link Google Account from Guest Mode.
 * Preserves all local SQLite data, enables Drive backup.
 */
export async function linkGoogleAccount(): Promise<{ success: boolean; authState?: AuthState; error?: string }> {
  return signInWithGoogle();
}

/**
 * Sign out from current session.
 */
export async function signOut(): Promise<void> {
  try {
    const mode = await AsyncStorage.getItem(KEY_AUTH_MODE);
    if (mode === 'google') {
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore if already signed out
      }
    }
    await AsyncStorage.removeItem(KEY_AUTH_MODE);
    await AsyncStorage.removeItem(KEY_USER_PROFILE);
    // Note: Local SQLite data is preserved for safety.
  } catch (error) {
    console.error('Error signing out:', error);
  }
}

/**
 * Updates the recorded lastSynced timestamp.
 */
export async function updateLastSyncedTimestamp(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(KEY_LAST_SYNCED, timestamp.toString());
}
