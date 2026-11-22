import { TurboModuleRegistry, NativeModules } from 'react-native';

/**
 * Safe native bridge for @react-native-google-signin/google-signin.
 *
 * In standard Expo Go, custom native TurboModules like 'RNGoogleSignin' are not
 * compiled into the binary. Calling require('@react-native-google-signin/google-signin')
 * causes TurboModuleRegistry.getEnforcing('RNGoogleSignin') to throw an Invariant Violation.
 *
 * By proactively inspecting TurboModuleRegistry.get('RNGoogleSignin') and
 * NativeModules.RNGoogleSignin BEFORE requiring the module, we prevent getEnforcing
 * from ever being called in Expo Go.
 *
 * When built into a native APK (npx expo run:android / eas build), RNGoogleSignin
 * is registered in the binary, and this bridge initializes full native Google Sign-In & Drive sync.
 */

let GoogleSigninModule: any = null;
let statusCodesModule: any = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};
let isNativeModuleAvailable: boolean | null = null;

export function getNativeGoogleSignin(): {
  isAvailable: boolean;
  GoogleSignin: any;
  statusCodes: any;
} {
  if (isNativeModuleAvailable !== null) {
    return {
      isAvailable: isNativeModuleAvailable,
      GoogleSignin: GoogleSigninModule,
      statusCodes: statusCodesModule,
    };
  }

  // Pre-check if RNGoogleSignin is registered in the native binary
  const hasNativeModule = Boolean(
    (typeof TurboModuleRegistry?.get === 'function' && TurboModuleRegistry.get('RNGoogleSignin') != null) ||
    NativeModules?.RNGoogleSignin != null
  );

  if (!hasNativeModule) {
    isNativeModuleAvailable = false;
    return {
      isAvailable: false,
      GoogleSignin: null,
      statusCodes: statusCodesModule,
    };
  }

  try {
    // Only require when the native module is actually present in the binary
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const gsignin = require('@react-native-google-signin/google-signin');
    GoogleSigninModule = gsignin.GoogleSignin;
    if (gsignin.statusCodes) {
      statusCodesModule = gsignin.statusCodes;
    }
    isNativeModuleAvailable = !!GoogleSigninModule;
  } catch (err) {
    isNativeModuleAvailable = false;
  }

  return {
    isAvailable: isNativeModuleAvailable,
    GoogleSignin: GoogleSigninModule,
    statusCodes: statusCodesModule,
  };
}
