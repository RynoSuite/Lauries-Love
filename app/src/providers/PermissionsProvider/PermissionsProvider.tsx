import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  Linking,
  PermissionsAndroid,
  PermissionStatus,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

// types
import { PermissionsAllType } from './PermissionsProvider.types';

// utils
import { customShowError } from 'utils/other';

// constants
import { PERMISSIONS_DEFAULT } from './PermissionsProvider.constants';
import { useActionSheet } from 'providers/ActionSheetProvider/ActionSheetProvider';

type PermissionsContext = {
  permissions: PermissionsAllType;
  requestPermissionsImagePicker: () => Promise<ImagePicker.PermissionStatus | null>;
  requestPermissionsCamera: () => Promise<ImagePicker.PermissionStatus | null>;
  requestPermissionsNotificationFirebase: () => Promise<{
    notificationFirebaseIOS: FirebaseMessagingTypes.AuthorizationStatus | null;
    notificationFirebaseAndroid: PermissionStatus | null;
  }>;
};

type PermissionsProviderProps = {
  children: JSX.Element;
};

export const permissionsContext = createContext({} as PermissionsContext);

const PermissionsProvider: FunctionComponent<PermissionsProviderProps> = ({
  children,
}) => {
  const { showSheet } = useActionSheet();
  const [permissions, setPermissions] =
    useState<PermissionsAllType>(PERMISSIONS_DEFAULT);

  const getPermissions = async () => {
    const { status: imagePicker } =
      await ImagePicker.getMediaLibraryPermissionsAsync();
    const { status: camera } = await ImagePicker.getCameraPermissionsAsync();
    //TODO: temp logic
    const notificationFirebaseIOS =
      Platform.OS === 'ios' ? await messaging().hasPermission() : null;
    const notificationFirebaseAndroid =
      Platform.OS === 'android'
        ? await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          )
        : null;

    setPermissions(prev => ({
      ...prev,
      imagePicker,
      camera,
      notificationFirebaseIOS,
      notificationFirebaseAndroid: notificationFirebaseAndroid
        ? 'granted'
        : 'denied',
    }));
  };

  const goToSettings = (titleType: string) => {
    showSheet({
      title: 'Permission required',
      message: `We need access to your ${titleType}. You can turn it on in Settings.`,
      items: [
        {
          label: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ],
    });
  };

  const requestPermissionsImagePicker = async () => {
    try {
      const { status: imagePicker } =
        await ImagePicker.requestMediaLibraryPermissionsAsync(true);
      if (imagePicker === 'denied') goToSettings('photos');

      setPermissions(prev => ({
        ...prev,
        imagePicker,
      }));
      return imagePicker;
    } catch (error) {
      customShowError({ error });
      return null;
    }
  };

  const requestPermissionsCamera = async () => {
    try {
      const { status: camera } =
        await ImagePicker.requestCameraPermissionsAsync();
      if (camera === 'denied') goToSettings('camera');

      setPermissions(prev => ({
        ...prev,
        camera,
      }));
      return camera;
    } catch (error) {
      customShowError({ error });
      return null;
    }
  };

  const requestPermissionsNotificationFirebase = async () => {
    try {
      if (Platform.OS === 'ios') {
        const notificationFirebaseIOS = await messaging().requestPermission();
        setPermissions(prev => ({
          ...prev,
          notificationFirebaseIOS,
        }));
        return {
          notificationFirebaseIOS,
          notificationFirebaseAndroid: null,
        };
      } else {
        const granted = await messaging().requestPermission();
        const notificationFirebaseAndroid = granted ? 'granted' : 'denied';
        setPermissions(prev => ({
          ...prev,
          notificationFirebaseAndroid,
        }));
        return {
          notificationFirebaseIOS: null,
          notificationFirebaseAndroid,
        };
      }
    } catch (error) {
      customShowError({ error });
      return {
        notificationFirebaseIOS: null,
        notificationFirebaseAndroid: null,
      };
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  const value = useMemo(
    () => ({
      permissions,
      requestPermissionsImagePicker,
      requestPermissionsCamera,
      requestPermissionsNotificationFirebase,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions],
  );

  return (
    <permissionsContext.Provider value={value}>
      {children}
    </permissionsContext.Provider>
  );
};

export const usePermissionsProvider = () => useContext(permissionsContext);

export default PermissionsProvider;
