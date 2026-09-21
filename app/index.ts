import { registerRootComponent } from 'expo';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import * as Sentry from './src/services/sentry.shim';

// Sentry starts FIRST, and App arrives by require() rather than import.
//
// ES imports hoist: `import App from './src/main/App'` evaluates the entire
// app module tree — every provider, navigator, screen and stylesheet — before
// a single statement in this file runs. A module that throws while being
// evaluated therefore kills the app before any reporter exists, and all the
// device gets is SIGABRT out of RCTExceptionsManager with no clue which module
// it was. That is exactly the crash build 156 shipped with.
//
// require() is deliberate and must stay deliberate: turning it back into an
// import silently restores the blind spot.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  debug: false,
});

// A last-resort net for anything Sentry's own handlers miss during startup.
// It only reports; it does not swallow, so behaviour is unchanged.
//
// Guarded by typeof rather than a truthiness check: ErrorUtils is a React
// Native global, and a bare reference to a missing global is a ReferenceError
// — which would make this diagnostic the cause of the very crash it exists to
// diagnose.
try {
  const eu = typeof ErrorUtils !== 'undefined' ? ErrorUtils : undefined;
  const previousHandler = eu?.getGlobalHandler?.();
  eu?.setGlobalHandler?.((error: unknown, isFatal?: boolean) => {
    try {
      Sentry.captureException(error);
    } catch {
      // Reporting must never be the thing that crashes us.
    }
    previousHandler?.(error as Error, isFatal);
  });
} catch {
  // No global handler available; Sentry's own hooks still apply.
}

// Firebase messaging background handler. Wrapped because Firebase may not be
// initialised yet.
try {
  const messaging = require('@react-native-firebase/messaging').default;
  messaging().setBackgroundMessageHandler(async (_remoteMessage: unknown) => {
    // Background message handler
  });
} catch (error) {
  // Firebase messaging not initialized
}

const App = require('./src/main/App').default;

registerRootComponent(App);
