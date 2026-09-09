import React, {
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';

// providers
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';

// constants
import { DEFAULT_APP_CONFIG } from './ApiProvider.constants';

// mock mode (local UI testing without a backend)
import { MOCK_ENABLED } from 'mocks/mock.config';
import { mockApi } from 'mocks/mock.api';

// Backend V2 (Supabase)
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { supabaseApi } from 'services/supabase/supabase.api';

type ApiType = <T>(
  url: string,
  configurations?: {
    config?: AxiosRequestConfig | null;
    type?: 'api';
  },
) => Promise<T>;

type ApiContext = {
  api: ApiType;
};

type ApiProviderProps = {
  children: JSX.Element;
};

export const apiContext = React.createContext({} as ApiContext);

const ApiProvider: FunctionComponent<ApiProviderProps> = ({ children }) => {
  const { jwtTokenUser } = useUserAWSProvider();
  const api: ApiType = async (url, configurations = {}) => {
    const { config, type = 'api' } = configurations;
    const urlApi = DEFAULT_APP_CONFIG.baseURL;
    const queryParams = qs.stringify(
      {},
      {
        addQueryPrefix: !url.includes('?'),
      },
    );
    const currentUrl = url.includes('http')
      ? url
      : `${urlApi}${url}${url.includes('?') ? `&${queryParams}` : queryParams}`;

    // Mock and Supabase are route TABLES keyed on the path: they match on
    // '/users/...', not on a URL. DEFAULT_APP_CONFIG.baseURL points at the
    // legacy NestJS API, which no longer exists, so it is undefined — and
    // template interpolation turned that into the literal string
    // "undefined/users/getUserInfoByCognitoId/...". Every route then fell
    // through as UNHANDLED and returned null.
    //
    // That is why login appeared to do nothing: sign-in succeeded, the profile
    // fetch silently returned null, and the root navigator sent the member back
    // to the login screen because it had no profile to check.
    const routedPath = url;

    if (MOCK_ENABLED) {
      return (await mockApi(routedPath, {
        method: config?.method,
        data: config?.data,
      })) as any;
    }

    if (SUPABASE_ENABLED) {
      return (await supabaseApi(routedPath, {
        method: config?.method,
        data: config?.data,
      })) as any;
    }

    try {
      const response = await axios(currentUrl, {
        ...config,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtTokenUser}`,
          ...config?.headers,
        },
      });

      return response.data;
    } catch (error: any) {
      if (__DEV__) {
        console.warn('currentUrl', currentUrl);
        console.warn('config', {
          ...config,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwtTokenUser}`,
            ...config?.headers,
          },
        });
        if (error instanceof Error)
          console.warn('error-message', error.message);
      }
      throw error;
    }
  };

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ api }), [jwtTokenUser]);

  return <apiContext.Provider value={value}>{children}</apiContext.Provider>;
};

export const useApiProvider = () => useContext(apiContext);

export default ApiProvider;
