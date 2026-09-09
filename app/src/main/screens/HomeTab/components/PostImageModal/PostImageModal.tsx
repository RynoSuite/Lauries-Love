import React, { FunctionComponent } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

// providers
import { usePermissionsProvider } from 'providers/PermissionsProvider/PermissionsProvider';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// components
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';
import ButtonModalTabs from '../../../../../components/ButtonModalTabs/ButtonModalTabs';

import { customShowError } from 'utils/other';

// icons
import {
  IconCameraAvatar,
  IconClose,
  IconGallery,
} from 'assets/icons-auto/components';

// styles
import styles from './PostImageModal.styles';
import colors from 'styles/colors';

export type ImageUploadItem = {
  asset: ImagePicker.ImagePickerAsset;
  previewUri: string;
  base64: string;
  mimeType: string;
  ext: string;
};
type PostImageModalProps = {
  onClose: () => void;
  onImageSelected: (imageAsset: ImageUploadItem) => void;
};

const MAX_IMAGE_SIZE_MB = 5;

const PostImageModal: FunctionComponent<PostImageModalProps> = ({
  onClose,
  onImageSelected,
}) => {
  const {
    permissions,
    requestPermissionsImagePicker,
    requestPermissionsCamera,
  } = usePermissionsProvider();
  const { showToast } = useToastProvider();
  const { bottom } = useSafeAreaInsets();

  const isAllowedImageType = (mimeType: string) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    return allowed.includes(mimeType);
  };

  const getImageExt = (mimeType: string) => {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return map[mimeType] ?? 'jpg';
  };

  const handleImageSelect = async (
    imageAsset: ImagePicker.ImagePickerAsset,
  ) => {
    if (!imageAsset.base64) return;

    const mimeType = imageAsset.mimeType || 'image/jpeg';

    if (!isAllowedImageType(mimeType)) {
      customShowError({
        error: new Error('Only JPG, PNG, and WEBP images are supported.'),
        showToast,
      });
      return;
    }
    const base64Length = imageAsset.base64.length;
    const estimatedSizeInMB = (base64Length * 3) / 4 / (1024 * 1024);
    if (estimatedSizeInMB > MAX_IMAGE_SIZE_MB) {
      customShowError({
        error: new Error('Image size exceeds 5MB limit.'),
        showToast,
      });
      return;
    }

    onImageSelected({
      asset: imageAsset,
      previewUri: imageAsset.uri,
      base64: imageAsset.base64,
      mimeType: mimeType,
      ext: getImageExt(mimeType),
    });
    onClose();
  };

  const pickImageFromGallery = async () => {
    try {
      const status =
        permissions.imagePicker === 'granted'
          ? permissions.imagePicker
          : await requestPermissionsImagePicker();
      if (status !== ImagePicker.PermissionStatus.GRANTED) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;

      handleImageSelect(result.assets[0]);
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
    }
  };

  const takePhotoWithCamera = async () => {
    try {
      const status =
        permissions.camera === 'granted'
          ? permissions.camera
          : await requestPermissionsCamera();
      if (status !== ImagePicker.PermissionStatus.GRANTED) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;

      handleImageSelect(result.assets[0]);
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
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
          paddingBottom: bottom + 26,
        }}
      >
        <View style={styles.header}>
          <Text style={styles.titleHeader}>Choose Photo</Text>
          <TouchableOpacity onPress={onClose} style={styles.buttonHeader}>
            <IconClose
              width={30}
              height={30}
              stroke={colors.neutral[700]}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.857}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <ButtonModalTabs
            label="Take a photo"
            Icon={IconCameraAvatar}
            onPress={takePhotoWithCamera}
            styleContainer={styles.buttonContainer}
            styleLabel={styles.label}
            isRightArrow={false}
            iconProps={{
              stroke: colors.heading,
              strokeWidth: 2.1,
            }}
          />
          <ButtonModalTabs
            label="Choose photo"
            Icon={IconGallery}
            onPress={pickImageFromGallery}
            styleContainer={styles.buttonContainer}
            isRightArrow={false}
            styleLabel={styles.label}
            iconProps={{
              stroke: colors.heading,
              strokeWidth: 2.1,
            }}
          />
          {/* <ButtonModalTabs
            label="My Media"
            Icon={IconGallery}
            onPress={pickImageFromGallery}
            styleContainer={styles.buttonContainer}
            isRightArrow={false}
            styleLabel={styles.label}
            iconProps={{
              stroke: colors.heading,
              strokeWidth: 2.1,
            }}
          /> */}
        </View>
      </View>
    </BottomSheetCustom>
  );
};

export default PostImageModal;
