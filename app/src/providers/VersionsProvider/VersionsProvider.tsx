import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Link from 'expo-linking';
import VersionCheck from 'react-native-version-check';

// components
import ModalUniversal from 'components/ModalUniversal/ModalUniversal';
import Button from 'components/Button/Button';

// styles
import styles from './VersionsProvider.styles';

type VersionsContext = {};

type VersionsProviderProps = {
  children: React.ReactNode;
};

export const versionsContext = createContext({} as VersionsContext);

const VersionsProvider: FunctionComponent<VersionsProviderProps> = ({
  children,
}) => {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  function handleUpdate() {
    const storeUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/es/app/lauries-love/id1624981989'
        : 'https://play.google.com/store/apps/details?id=com.lauriesloveapp&hl=en';

    Link.openURL(storeUrl);
  }

  function compareVersions(currentVersion: string, latestVersion: string) {
    const current = currentVersion.split('.').map(Number);
    const latest = latestVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, latest.length); i++) {
      const c = current[i] || 0;
      const l = latest[i] || 0;

      if (c < l) return true;
      if (c > l) return false;
    }

    return false;
  }

  useEffect(() => {
    async function fetchLatestVersion() {
      // The check asks the live store listing what the newest published
      // version is. A development or internal build is always older than
      // what the client has shipped, so this modal — which has no dismiss
      // and one button that leaves for the store — blocks every build we
      // make. Correct in production, useless anywhere else.
      if (__DEV__) return;
      try {
        const latestVersion =
          (await VersionCheck.getLatestVersion({
            provider: Platform.OS === 'ios' ? 'appStore' : 'playStore',
          })) || '0.0.0';

        const currentVersion = Constants.expoConfig?.version || '0.0.0';

        if (compareVersions(currentVersion, latestVersion)) {
          setIsUpdateAvailable(true);
        }
      } catch (error) {
        console.error('Error fetching latest version from App Store:', error);
      }
    }

    fetchLatestVersion();
  }, []);

  const value = useMemo(() => ({}), []);

  return (
    <versionsContext.Provider value={value}>
      {children}
      {isUpdateAvailable && (
        <ModalUniversal
          disableOverlayPress
          styleBackgroundButton={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Update Available!</Text>
              <Text style={styles.modalMessage}>
                A new version of Lauries Love is available, click the button
                below to update.
              </Text>
            </View>
            <View style={styles.modalButtons}>
              <Button title="Update Now" onPress={handleUpdate} />
            </View>
          </View>
        </ModalUniversal>
      )}
    </versionsContext.Provider>
  );
};

export const useVersionsProvider = () => useContext(versionsContext);

export default VersionsProvider;
