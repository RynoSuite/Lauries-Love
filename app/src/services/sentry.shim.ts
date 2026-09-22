// Sentry integration seam.
//
// This module is the SINGLE import point for Sentry across the app (every call
// site imports from 'services/sentry.shim'), so the SDK can be swapped without
// touching call sites. It now delegates to the REAL @sentry/react-native, but
// stays inert until a DSN is configured:
//   * init() only calls Sentry.init when EXPO_PUBLIC_SENTRY_DSN is set, so a
//     keyless build never touches the native SDK.
//   * captureException/captureMessage are safe to call before init (they no-op
//     until the SDK is initialized).
//
// ⚠️ NATIVE STEP: after pulling this, run `yarn && npx pod-install` (or
// `pod install`) and rebuild — @sentry/react-native ships a native module.
// Set EXPO_PUBLIC_SENTRY_DSN in app/.env + EAS to turn reporting on.
import * as Sentry from '@sentry/react-native';

export const captureException = (error?: unknown): void => {
  Sentry.captureException(error);
};

export const captureMessage = (msg?: string): void => {
  if (typeof msg === 'string') Sentry.captureMessage(msg);
};

/**
 * Reporting is OFF unless EXPO_PUBLIC_SENTRY_ENABLED is exactly "true".
 *
 * A single switch, deliberately separate from the DSN, so the DSN can stay
 * configured while reporting is off — and so moving to the client's own Sentry
 * account later is a DSN change and nothing else.
 *
 * It is an EXPO_PUBLIC_* value, which means it is inlined when the JavaScript
 * is bundled — so it can be flipped by an over-the-air update in about a
 * minute, without a build or an App Store review. Change it in eas.json
 * (build."staging-env".env) and run:
 *
 *     node scripts/ota-update.mjs testflight "Turn crash reporting on"
 *
 * Turned off on 22 Sept at Jeremy's request, once the performance cost was
 * traced to Sentry's session replay. Worth knowing what it costs: while this
 * is off, a crash from a board member arrives as the words "it crashed", and
 * the only way back to a real stack trace is a device .ips file — which is how
 * the startup crash consumed a night before reporting existed.
 */
export const isEnabled = (): boolean =>
  process.env.EXPO_PUBLIC_SENTRY_ENABLED === 'true';

export const init = (settings?: { dsn?: string } & Record<string, unknown>): void => {
  if (!isEnabled()) return;
  if (!settings?.dsn) return;
  Sentry.init(settings as Sentry.ReactNativeOptions);
};

// Error-boundary wrapper for the root component (safe even before init).
export const wrap = <T>(component: T): T =>
  Sentry.wrap(component as never) as unknown as T;

export const mobileReplayIntegration = (
  opts?: Record<string, unknown>,
): unknown => Sentry.mobileReplayIntegration(opts as never);

export default {
  captureException,
  captureMessage,
  init,
  wrap,
  mobileReplayIntegration,
};
