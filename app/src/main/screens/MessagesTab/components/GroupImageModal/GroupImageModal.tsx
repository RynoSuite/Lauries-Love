import React, { FunctionComponent } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

// providers
import { usePermissionsProvider } from 'providers/PermissionsProvider/PermissionsProvider';

// components
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';
import ButtonModalTabs from 'components/ButtonModalTabs/ButtonModalTabs';

// icons
import {
  IconCameraAvatar,
  IconClose,
  IconGallery,
} from 'assets/icons-auto/components';

// styles
import styles from './GroupImageModal.styles';
import colors from 'styles/colors';

type GroupImageModalProps = {
  onClose: () => void;
  onSubmittedImage: (image: ImagePicker.ImagePickerAsset) => void;
};

const GroupImageModal: FunctionComponent<GroupImageModalProps> = ({
  onClose,
  onSubmittedImage,
}) => {
  const {
    permissions,
    requestPermissionsCamera,
    requestPermissionsImagePicker,
  } = usePermissionsProvider();
  const { bottom } = useSafeAreaInsets();

  const takePhotoWithCamera = async () => {
    try {
      const status =
        permissions.camera !== 'granted'
          ? await requestPermissionsCamera()
          : permissions.camera;
      if (status !== 'granted')
        return Alert.alert(
          'Permission required',
          'You need to enable camera permission to take a photo',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.1,
      });
      if (result.canceled) return;

      onSubmittedImage(result.assets[0]);
    } catch (error) {
      if (__DEV__) console.warn(error);
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const status =
        permissions.imagePicker !== 'granted'
          ? await requestPermissionsImagePicker()
          : permissions.imagePicker;
      if (status !== 'granted')
        return Alert.alert(
          'Permission required',
          'You need to enable camera permission to take a photo',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.1,
      });
      if (result.canceled) return;

      onSubmittedImage(result.assets[0]);
    } catch (error) {
      if (__DEV__) console.warn(error);
    }
  };

  return (
    <BottomSheetCustom
      onClose={onClose}
      snapPoints={['10%']}
      handleIndicatorStyle={styles.handleIndicatorStyle}
    >
      <View
        style={{
          paddingBottom: bottom + 30,
        }}
      >
        <View style={styles.header}>
          <Text style={styles.titleHeader}>Group Image</Text>
          <TouchableOpacity onPress={onClose} style={styles.buttonHeader}>
            <IconClose
              width={30}
              height={30}
              stroke={colors.muted}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.857}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <ButtonModalTabs
            label="Take photo"
            Icon={IconCameraAvatar}
            onPress={takePhotoWithCamera}
            styleContainer={styles.buttonContainer}
            styleLabel={styles.label}
            isRightArrow={false}
            iconProps={{
              stroke: colors.muted,
              strokeWidth: 2.1,
            }}
          />
          <ButtonModalTabs
            label="Choose photo"
            Icon={IconGallery}
            onPress={pickImageFromGallery}
            styleContainer={styles.buttonContainer}
            styleLabel={styles.label}
            isRightArrow={false}
            iconProps={{
              stroke: colors.muted,
              strokeWidth: 2.1,
            }}
          />
        </View>
      </View>
    </BottomSheetCustom>
  );
};

export default GroupImageModal;
