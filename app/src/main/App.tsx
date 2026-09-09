import React, { useEffect, useMemo, useState } from 'react';
import { LogBox, StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from 'services/sentry.shim';
import SplashScreen from 'react-native-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { initFacebookSDK } from 'services/facebookTracking';

// providers
import AppThemeProvider from 'presentation/theme';
import ToastProvider from 'providers/ToastProvider/ToastProvider';
import UserDBProvider from 'providers/UserDBProvider/UserDBProvider';
import UserAWSProvider from 'providers/UserAWSProvider/UserAWSProvider';
import ApiProvider from 'providers/ApiProvider/ApiProvider';
import PaymentProvider from 'providers/PaymentProvider/PaymentProvider';
import DBProvider from 'providers/DBProvider/DBProvider';
import KeyboardProvider from 'providers/KeyboardProvider/KeyboardProvider';
import PermissionsProvider from 'providers/PermissionsProvider/PermissionsProvider';
import ChatProvider from 'providers/ChatProvider/ChatProvider';
import PushNotificationProvider from 'providers/PushNotificationProvider/PushNotificationProvider';
import PostsProvider from 'providers/PostsProvider/PostsProvider';
import VersionsProvider from 'providers/VersionsProvider/VersionsProvider';
import ActionSheetProvider from 'providers/ActionSheetProvider/ActionSheetProvider';
import { IntercomProvider } from 'providers/IntercomProvider/IntercomProvider';

// navigators
import { ApplicationNavigator } from './navigators';

// constants
import { appConfig } from './config/app.config';
import { ONBOARDING_NAMES_SCREEN } from './navigators/paths';

// styles
import { FONTS } from 'styles/fonts';

// TODO: remove this library, need change to lingui/react-i18next
import i18next from 'presentation/translations';
import PosthogProvider from 'providers/PosthogProvider/PosthogProvider';

// Known-noise warnings (dummy keys / stripped services / library deprecations).
// Suppressed from the LogBox overlay so only REAL problems surface on-device.
LogBox.ignoreLogs([
  'This method is deprecated (as well as all React Native Firebase namespaced API)',
  /\[UIKIT_ios\]/,
  'No info about this app.',
  'RNApplePay is not defined',
  'Failed to register identified user',
  /Sentry Logger/,
  'FacebookAdvertiserIDCollectionEnabled',
  '[expo-av]: Expo AV has been deprecated',
]);

// Only init Sentry when a DSN is configured; an empty DSN leaves the SDK in a
// half-initialized state that logs a red "Transport disabled" error on every
// captureException call.
if (appConfig.DEFAULT_SENTRY_SETTINGS.dsn) {
  Sentry.init(appConfig.DEFAULT_SENTRY_SETTINGS);
}
// Amplify.configure removed — aws-amplify is no longer part of the app
// (Cognito/S3 replaced by Supabase auth + storage).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Rebuild fix (P1 perf): the app previously used `new QueryClient()` with no
// defaults, so every query was stale immediately and refetched on mount/focus/
// reconnect — a major driver of general slowness. Set conservative mobile defaults.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — data considered fresh, no needless refetch
      gcTime: 10 * 60 * 1000, // keep cache 10 min
      refetchOnWindowFocus: false, // don't refetch every time the app is foregrounded
      refetchOnMount: 'stale', // only refetch on mount if actually stale
      refetchOnReconnect: 'stale',
      retry: 1,
    },
  },
});

export default function App() {
  const [currentRouteName, setCurrentRouteName] = useState<string | null>(null);
  const [loaded] = useFonts(FONTS);

  const isOnboarding = useMemo(
    () =>
      Boolean(
        currentRouteName && ONBOARDING_NAMES_SCREEN.includes(currentRouteName),
      ),
    [currentRouteName],
  );

  useEffect(() => {
    if (!loaded) return;
    // Perf: was a hardcoded 2000ms hold AFTER fonts loaded — 1.7s of dead
    // perceived boot time. 300ms is enough to avoid a first-frame flash.
    const timer = setTimeout(() => {
      SplashScreen.hide();
    }, 300);
    return () => clearTimeout(timer);
  }, [loaded]);

  useEffect(() => {
    initFacebookSDK();
  }, []);

  return (
    <KeyboardProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18next}>
          <AppThemeProvider setCurrentRouteName={setCurrentRouteName}>
            <GestureHandlerRootView style={styles.rootView}>
              <ToastProvider>
                <ActionSheetProvider>
                <UserAWSProvider>
                  <ApiProvider>
                    <IntercomProvider>
                      <DBProvider>
                        <UserDBProvider
                          currentRouteName={currentRouteName}
                          isOnboarding={isOnboarding}
                        >
                          <PosthogProvider>
                            <ChatProvider>
                              <PostsProvider>
                                <PaymentProvider>
                                  <PermissionsProvider>
                                    <PushNotificationProvider>
                                      <VersionsProvider>
                                        <ApplicationNavigator
                                          currentRouteName={currentRouteName}
                                          isOnboarding={isOnboarding}
                                        />
                                      </VersionsProvider>
                                    </PushNotificationProvider>
                                  </PermissionsProvider>
                                </PaymentProvider>
                              </PostsProvider>
                            </ChatProvider>
                          </PosthogProvider>
                        </UserDBProvider>
                      </DBProvider>
                    </IntercomProvider>
                  </ApiProvider>
                </UserAWSProvider>
                </ActionSheetProvider>
              </ToastProvider>
            </GestureHandlerRootView>
          </AppThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  rootView: { flex: 1 },
});
