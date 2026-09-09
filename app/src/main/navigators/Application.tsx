import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { useNavigationContainerRef } from '@react-navigation/native';
import { useLogger } from '@react-navigation/devtools';

// providers
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// components
import LoggedOutNavigator from './LoggedOut.navigator';
import { LoggedInNavigator } from './loggedIn';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import colors from 'styles/colors';

type ApplicationNavigatorProps = {
  currentRouteName: string | null;
  isOnboarding: boolean;
};

const KEY_STORAGE_IS_ONBOARDING = 'KEY_STORAGE_IS_ONBOARDING';

const ApplicationNavigator: FunctionComponent<ApplicationNavigatorProps> = ({
  currentRouteName,
  isOnboarding,
}) => {
  const { checkCurrentUserAWS, signOutAWS } = useUserAWSProvider();
  const [isChecking, setIsChecking] = useState(true);
  const { isLoading: isLoadingUserDB, userDB } = useUserDBProvider();
  const [isLoading, setIsLoading] = useState(true);
  const navigationRef = useNavigationContainerRef();

  useLogger(navigationRef);

  const isNotRegistration = useMemo(
    () => Boolean(!isOnboarding),
    [isOnboarding, userDB],
  );
  const isRegistrationFull = useMemo(
    () =>
      userDB &&
      isNotRegistration &&
      userDB.diagnosisTypes &&
      userDB.role &&
      userDB.age &&
      userDB.gender &&
      userDB.city &&
      userDB.country,
    // NOTE: zipCode intentionally NOT required — it lives in profiles_private
    // and is null for most accounts, which was bouncing successfully
    // authenticated users back to onboarding/login (fix 2026-08-23).
    [isNotRegistration, userDB],
  );

  const getUserDB = async () => {
    try {
      if (userDB) return;

      const user = await checkCurrentUserAWS();
      if (!user || !user.authSession.userSub) return;

      // TOKEN
      setIsChecking(false);
    } catch (error) {
      if (__DEV__) console.warn('Failed to check current user', error);
    } finally {
      setIsChecking(false);
    }
  };

  const checkUser = async () => {
    try {
      const isOnboardingStorage = await AsyncStorage.getItem(
        KEY_STORAGE_IS_ONBOARDING,
      );
      if (isOnboardingStorage) {
        await signOutAWS();
        await AsyncStorage.removeItem(KEY_STORAGE_IS_ONBOARDING);
        return;
      }

      await getUserDB();
    } catch (error) {
      if (__DEV__) console.warn('Failed to check current user', error);
    } finally {
      setIsLoading(false);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (isOnboarding) AsyncStorage.setItem(KEY_STORAGE_IS_ONBOARDING, 'true');
    else AsyncStorage.removeItem(KEY_STORAGE_IS_ONBOARDING);
  }, [isOnboarding]);

  if (isLoading || isLoadingUserDB || isChecking) {
    return (
      <LinearGradient
        colors={[colors.ground, colors.surface, colors.surface2]}
        locations={[0, 0.8, 1]}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ActivityIndicator size="large" color="#911766" />
      </LinearGradient>
    );
  }

  console.log('[LL] gate:', JSON.stringify({
    isOnboarding,
    hasUserDB: !!userDB,
    role: !!userDB?.role,
    diagnosisTypes: userDB?.diagnosisTypes?.length ?? 0,
    age: userDB?.age ?? null,
    gender: userDB?.gender ?? null,
    city: userDB?.city ?? null,
    country: userDB?.country ?? null,
    isRegistrationFull: !!isRegistrationFull,
  }));

  return (
    <>
      <StatusBar barStyle="light-content" />
      {isRegistrationFull ? (
        <LoggedInNavigator currentRouteName={currentRouteName} />
      ) : (
        <LoggedOutNavigator />
      )}
    </>
  );
};

export default ApplicationNavigator;
