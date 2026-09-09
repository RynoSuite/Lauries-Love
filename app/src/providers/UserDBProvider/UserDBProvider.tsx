import { Platform } from 'react-native';
// import { useSelector } from 'react-redux';
import { captureException } from 'services/sentry.shim';
import React, {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { customShowError } from 'utils/other';
// import { RootState } from 'presentation/store';
import { UserDBType, UserOnboardingType } from './UserDBProvider.types';
import { getLocationCity } from 'utils/geolocation';
import { userDbSchema } from './UserDBProvider.schemas';
import { getFileStorageAmplify } from 'utils/amplify-storage';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { publicUrlFor } from 'services/supabase/supabase.storage';
import { useApiProvider } from 'providers/ApiProvider/ApiProvider';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { useIntercom } from 'providers/IntercomProvider/IntercomProvider';
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';
import { useCountry } from 'presentation/hooks';

// aws-amplify removed — structural stand-in for the old Cognito JWT type.
type JWT = { payload?: any; toString: () => string } | any;

type UserDBContext = {
  isLoading: boolean;
  userDB: UserDBType | null;
  getUserDB: (id: string, token?: JWT) => Promise<void>;
  createUserDB: (newUser: Partial<UserDBType>, token?: JWT) => Promise<boolean>;
  updateUserDB: (
    updatedUser: Partial<UserDBType>,
  ) => Promise<UserDBType | null>;
  signOutDB: () => Promise<boolean>;
  deleteUserDB: () => Promise<boolean>;
  getOnlyUserDBById: (id: string) => Promise<UserDBType | null>;
  checkGeoLocationCity: () => Promise<void>;
  userOnboarding: UserOnboardingType;
  setUserOnboarding: Dispatch<SetStateAction<UserOnboardingType>>;
};

type UserDBProviderProps = {
  children: React.ReactNode;
  currentRouteName: string | null;
  isOnboarding: boolean;
};

export const userDBContext = createContext({} as UserDBContext);

const UserDBProvider: FunctionComponent<UserDBProviderProps> = ({
  children,
  isOnboarding,
}) => {
  const { api } = useApiProvider();
  const { showToast } = useToastProvider();
  // const userRegistration = useSelector((state: RootState) => state.user);
  const [userOnboarding, setUserOnboarding] = useState<UserOnboardingType>({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    phoneLocation: '',
    country: '',
    city: '',
    zipCode: '',
    geoLocation: { latitude: 0, longitude: 0 },
    userType: '',
    cancerType: '',
    subCancerType: '',
    ageRange: '',
    gender: '',
    diagnosedYear: '',
  });
  const { userAWS, jwtTokenUser, signOutAWS } = useUserAWSProvider();
  const { signInIntercom, updateIntercom, signOutIntercom } = useIntercom();
  const { defaultCountry } = useCountry();

  const [userDB, setUserDB] = useState<UserDBType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getUserDB = async (id: string, token?: JWT) => {
    if (!isOnboarding) setIsLoading(true);
    try {
      const result: UserDBType = await api(
        `/users/getUserInfoByCognitoId/${id}`,
        {
          config: {
            headers: {
              Authorization: `Bearer ${token || jwtTokenUser}`,
            },
          },
        },
      );

      console.log('[LL] getUserDB result:', result ? 'got profile' : 'NULL');
      if (!result) {
        console.log('[LL] getUserDB returned nothing — userDB stays null');
        return;
      }

      const userId = result.cognitoId;
      const email = result.email;

      await signInIntercom(
        { userId, email },
        token?.toString() || jwtTokenUser?.toString() || '',
      );

      const name = result.displayName || '';
      const phone = result.phoneNumber || '';

      updateIntercom({ name, phone });

      // Supabase mode: avatars live in the public 'avatars' bucket — the
      // Amplify/S3 signed-url path fails silently there and avatars never
      // render. Legacy mode keeps the S3 signed url.
      const profileImgUrl = result.profilePicture
        ? SUPABASE_ENABLED
          ? publicUrlFor('avatars', result.profilePicture)
          : (await getFileStorageAmplify(result.profilePicture))?.href || null
        : null;
      setUserDB({
        ...result,
        profileImgUrl,
      });
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
      captureException(error);
    } finally {
      if (!isOnboarding) setIsLoading(false);
    }
  };

  const createUserDB = async (newUser: Partial<UserDBType>, token?: JWT) => {
    try {
      await api('/users', {
        config: {
          method: 'POST',
          data: newUser,
          headers: {
            Authorization: `Bearer ${token || jwtTokenUser}`,
          },
        },
      });

      await signInIntercom(
        { userId: newUser.cognitoId, email: newUser.email },
        token?.toString() || jwtTokenUser?.toString() || '',
      );

      signOutIntercom();
      return true;
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
      captureException(error);
      return false;
    }
  };

  const updateUserDB = async (updatedUser: Partial<UserDBType>) => {
    if (!userDB) return null;
    try {
      const result = await api(`/users/${userDB.id}`, {
        config: {
          method: 'PUT',
          data: updatedUser,
        },
      });
      if (!result) return null;

      const newUser = {
        ...userDB,
        ...updatedUser,
      };
      const profileImgUrl = newUser.profilePicture
        ? SUPABASE_ENABLED
          ? publicUrlFor('avatars', newUser.profilePicture)
          : (await getFileStorageAmplify(newUser.profilePicture))?.href || null
        : null;
      setUserDB({
        ...newUser,
        profileImgUrl,
      });
      return {
        ...newUser,
        profileImgUrl,
      };
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
      captureException(error);
      return null;
    }
  };

  const signOutDB = async () => {
    if (!userDB) return false;
    try {
      setUserDB(null);
      return await signOutAWS();
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
      captureException(error);
      return false;
    }
  };

  const deleteUserDB = async () => {
    if (!userDB) return false;
    try {
      await api(`/users`, {
        config: {
          method: 'DELETE',
          data: {
            active: false,
          },
        },
      });
      setUserDB(null);
      return await signOutAWS();
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
      captureException(error);
      return false;
    }
  };

  const getOnlyUserDBById = async (id: string) => {
    try {
      const result = await api(`/users/${id}`, {});
      return result || null;
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
      captureException(error);
      return null;
    }
  };

  const checkGeoLocationCity = async () => {
    try {
      if (userDB?.geoLocation?.latitude && userDB?.geoLocation?.longitude)
        return;
      if (!userDB?.city || !userDB?.country) return;

      const geocodedLocation = await getLocationCity(
        userDB.city,
        userDB?.country,
      );
      if (!geocodedLocation) return;
      await updateUserDB({ geoLocation: geocodedLocation });
    } catch (error) {
      if (__DEV__) console.warn('Failed to get location', error);
      captureException(error);
      return;
    }
  };

  useEffect(() => {
    if (userAWS?.userId) getUserDB(userAWS.userId);
    else {
      setUserDB(null);
      setIsLoading(false);
    }
  }, [userAWS?.userId]);

  useEffect(() => {
    if (
      userOnboarding?.fullName &&
      !(userDB?.displayName || userDB?.firstName)
    ) {
      const diagnosisTypes =
        userDB && userDB?.diagnosisTypes
          ? userDB.diagnosisTypes
          : userOnboarding?.cancerType
          ? [userOnboarding?.cancerType]
          : [];
      const diagnosisSubTypes =
        userDB && userDB?.diagnosisSubTypes
          ? userDB.diagnosisSubTypes
          : userOnboarding?.subCancerType
          ? [userOnboarding?.subCancerType]
          : [];
      updateUserDB({
        displayName:
          userDB?.displayName || userDB?.firstName || userOnboarding?.fullName,
        firstName: userDB?.firstName || userOnboarding?.fullName,
        email: userDB?.email || userOnboarding?.email,
        phoneNumber: userDB?.phoneNumber || userOnboarding?.phone,
        phoneNumberLocation:
          userDB?.phoneNumberLocation ||
          userOnboarding?.phoneLocation ||
          defaultCountry.code, // default to US
        diagnosisYear: userDB?.diagnosisYear || userOnboarding?.diagnosedYear,
        zipCode: userDB?.zipCode || userOnboarding?.zipCode || '',
        country: userDB?.country || userOnboarding?.country || '',
        city: userDB?.city || userOnboarding?.city || '',
        geoLocation: userDB?.geoLocation || userOnboarding?.geoLocation || null,
        diagnosisTypes,
        diagnosisSubTypes,
        age: userDB?.age || userOnboarding?.ageRange || '',
        gender: userDB?.gender || userOnboarding?.gender || '',
        role: userDB?.role || userOnboarding?.userType,
        profilePicture: null,
        config: {
          notifications: {
            active: false,
            notificationToken: '',
            deviceType: Platform.OS,
          },
        },
      });
    }
  }, [userDB?.id]);

  const value = useMemo(
    () => ({
      isLoading,
      userDB,
      getUserDB,
      createUserDB,
      updateUserDB,
      signOutDB,
      deleteUserDB,
      getOnlyUserDBById,
      checkGeoLocationCity,
      userOnboarding,
      setUserOnboarding,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isLoading,
      userDB,
      userOnboarding,
      jwtTokenUser,
      isOnboarding,
      api,
      showToast,
      signInIntercom,
      updateIntercom,
      signOutIntercom,
      signOutAWS,
      defaultCountry,
    ],
  );

  return (
    <userDBContext.Provider value={value}>
      {children}
    </userDBContext.Provider>
  );
};

export const useUserDBProvider = () => useContext(userDBContext);

export default UserDBProvider;
