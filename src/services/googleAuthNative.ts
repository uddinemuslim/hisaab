/**
 * Safe native bridge for @react-native-google-signin/google-signin.
 *
 * In standard Expo Go, custom native TurboModules like 'RNGoogleSignin' are not
 * compiled into the binary, causing an immediate:
 * "Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found"
 * when imported statically.
 *
 * This wrapper loads the native module on demand inside a try-catch block so that
 * the entire app (SQLite database, ledger calculations, Guest mode, all UI screens)
 * runs 100% smoothly in Expo Go, while seamlessly enabling native Google Sign-In &
 * Drive backup when running in an Expo Development Build (npx expo run:android) or
 * standalone APK.
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

  try {
    // Dynamic require wrapped in try-catch to safely handle Expo Go environment
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const gsignin = require('@react-native-google-signin/google-signin');
    GoogleSigninModule = gsignin.GoogleSignin;
    if (gsignin.statusCodes) {
      statusCodesModule = gsignin.statusCodes;
    }
    isNativeModuleAvailable = !!GoogleSigninModule;
  } catch (err) {
    // Caught in Expo Go where RNGoogleSignin TurboModule is absent from the host APK
    isNativeModuleAvailable = false;
  }

  return {
    isAvailable: isNativeModuleAvailable,
    GoogleSignin: GoogleSigninModule,
    statusCodes: statusCodesModule,
  };
}
