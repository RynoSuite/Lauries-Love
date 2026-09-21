import { Settings, AppEventsLogger } from 'react-native-fbsdk-next';

// The Facebook SDK is NOT configured, and initialising it unconfigured is
// actively harmful.
//
// app.json still carries the literal placeholders YOUR_FACEBOOK_APP_ID and
// YOUR_FACEBOOK_CLIENT_TOKEN — nobody ever supplied real ones. Android shows
// what that costs: four OAuthException "Error validating application. Invalid
// application ID." responses on every single launch.
//
// iOS is stricter than Android here. FBSDKCoreKit checks at startup that
// Info.plist registers an fb<appID> URL scheme, and that scheme had to be
// removed to clear Apple's ITMS-90158 rejection — an underscore is not legal
// in a URL scheme, and "fbYOUR_FACEBOOK_APP_ID" has two. So on iOS the SDK is
// now being initialised with credentials it cannot validate and no scheme to
// check, which is the difference between a logged warning and a dead app.
//
// Nothing is lost by switching it off: trackEvent() has no callers anywhere in
// the codebase, so the SDK's only observable effect was those failed requests.
//
// TO RE-ENABLE, once the client supplies real credentials:
//   1. put the real App ID and Client Token in app.json
//   2. restore the fb<realAppID> URL scheme in ios/LauriesLove/Info.plist
//      (a real numeric app id makes it a legal scheme, so Apple accepts it)
//   3. set FACEBOOK_CONFIGURED to true
const FACEBOOK_CONFIGURED = false;

export const initFacebookSDK = () => {
  if (!FACEBOOK_CONFIGURED) return;

  Settings.initializeSDK();
  AppEventsLogger.logEvent('AppLaunched');
  Settings.setAutoLogAppEventsEnabled(true);
  Settings.setAdvertiserTrackingEnabled(true);
  Settings.setAdvertiserIDCollectionEnabled(true);
};

export const trackEvent = (
  eventName: string,
  params: Record<string, any> = {},
): void => {
  if (!FACEBOOK_CONFIGURED) return;

  AppEventsLogger.logEvent(eventName, params);
};
