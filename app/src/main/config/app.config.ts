import * as Sentry from 'services/sentry.shim';

const DEFAULT_SENTRY_SETTINGS = {
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // Was __DEV__, which made Sentry log every transport tick and every session
  // replay screenshot to Metro — hundreds of lines a second, burying the
  // app's own logs and making the console useless for debugging.
  debug: false,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0,
  _experiments: {
    profilesSampleRate: 1.0,
    // Session replay screenshots every frame in development and tells you
    // about each one. Keep it for release, off while developing.
    replaysSessionSampleRate: __DEV__ ? 0 : 1.0,
    replaysOnErrorSampleRate: __DEV__ ? 0 : 1.0,
  },
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: true,
    }),
  ],
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
