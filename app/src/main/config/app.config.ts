const DEFAULT_SENTRY_SETTINGS = {
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // Was __DEV__, which made Sentry log every transport tick and every session
  // replay screenshot to Metro — hundreds of lines a second, burying the
  // app's own logs and making the console useless for debugging.
  debug: false,
  environment: __DEV__ ? 'development' : 'production',
  // These were ALL at 1.0, which meant a release build recorded a session
  // replay of every session: mobile replay screenshots the UI continuously and
  // masks every text, image and vector as it goes. It cost nothing while there
  // was no DSN, because none of it ran — but the DSN was set on 21 Sept to
  // diagnose the startup crash, and the app immediately felt laggy to scroll.
  //
  // What a review build actually needs is crashes and errors, which are
  // unsampled and free. Tracing is kept at a fifth for a sense of slow calls.
  // Replay and profiling are OFF: replaysOnErrorSampleRate is not the cheap
  // option it looks like, because buffering an on-error replay means recording
  // continuously in case an error arrives.
  tracesSampleRate: 0.2,
  _experiments: {
    profilesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  },
};

export const appConfig = {
  awsRegion: process.env.EXPO_PUBLIC_AWS_REGION,
  userCognitoPoolId: process.env.EXPO_PUBLIC_COGNITO_APP_CLIENT,
  userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL,
  cognitoIdnPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_CLIENT,
  s3Bucket: process.env.EXPO_PUBLIC_AWS_S3_BUCKET,
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  mapKeyId: process.env.EXPO_PUBLIC_MAP_KEY_ID,
  mapKeyValue: process.env.EXPO_PUBLIC_MAP_KEY_VALUE,
  authorizeNetGatewayId: process.env.EXPO_PUBLIC_AUTHORIZE_NET_GATEWAY_ID,
  authorizeNetEnv: process.env.EXPO_PUBLIC_AUTHORIZE_ENV,
  applePayMerchantId: process.env.EXPO_PUBLIC_APPLE_PAY_MERCHANT_ID,
  DEFAULT_SENTRY_SETTINGS,
  temp: 64,
};

export const publicFiles = {
  privacyKey: 'public-documents/privacy-policy.pdf',
  termsKey: 'public-documents/terms.pdf',
};
