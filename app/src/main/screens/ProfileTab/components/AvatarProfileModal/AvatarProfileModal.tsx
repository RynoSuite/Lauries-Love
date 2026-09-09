import React, { FunctionComponent, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import uuid from 'react-native-uuid';

// types
import { UserDBType } from 'providers/UserDBProvider/UserDBProvider.types';

// providers
import { usePermissionsProvider } from 'providers/PermissionsProvider/PermissionsProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// components
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';
import ButtonModalTabs from '../../../../../components/ButtonModalTabs/ButtonModalTabs';

// utils
import getUserPicsPath from 'utils/getUserPicsPath';
import {
  removeFileStorageAmplify,
  uploadFileStorageAmplify,
} from 'utils/amplify-storage';
import { customShowError } from 'utils/other';

// supabase (Backend V2) storage
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { uploadImageBase64 } from 'services/supabase/supabase.storage';

// icons
import {
  IconCameraAvatar,
  IconClose,
  IconGallery,
  IconTrashProfile,
} from 'assets/icons-auto/components';

// styles
import styles from './AvatarProfileModal.styles';
import colors from 'styles/colors';

type AvatarProfileModalProps = {
  userDB: UserDBType;
  onClose: () => void;
};

const AvatarProfileModal: FunctionComponent<AvatarProfileModalProps> = ({
  userDB,
  onClose,
}) => {
  const {
    permissions,
    requestPermissionsImagePicker,
    requestPermissionsCamera,
  } = usePermissionsProvider();
  const { updateUserDB } = useUserDBProvider();
  const { showToast } = useToastProvider();
  const { bottom } = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const deleteProfileImage = async () => {
    setIsLoading(true);
    try {
      if (!userDB.profilePicture) return;
      // Legacy S3 delete only — in Supabase mode clearing the DB pointer is
      // all that's needed (no Amplify call).
      if (!SUPABASE_ENABLED)
        await removeFileStorageAmplify(userDB.profilePicture);

      await updateUserDB({ profilePicture: null });
      onClose();
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadPhoto = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    if (!imageAsset.base64) return;

    try {
      if (userDB.profilePicture) await deleteProfileImage();

      setIsLoading(true);
      const ext = imageAsset.mimeType === 'image/jpeg' ? 'jpg' : 'png';

      if (SUPABASE_ENABLED) {
        // Supabase Storage: profilePicture stores the returned storage PATH
        // (same call shape as the legacy S3 key); rendered via publicUrlFor.
        const path = await uploadImageBase64(
          'avatars',
          imageAsset.base64,
          ext,
        );
        const resultUpdate = await updateUserDB({ profilePicture: path });
        if (!resultUpdate) return;

        onClose();
        return;
      }

      const arrayBuffer = Uint8Array.from(atob(imageAsset.base64), c =>
        c.charCodeAt(0),
      );
      const picKey = `${getUserPicsPath(
        userDB.id,
      )}/profilePhotos/${uuid.v4()}.${ext}`;
      const resultUpload = await uploadFileStorageAmplify(picKey, arrayBuffer);
      if (!resultUpload) return;

      const resultUpdate = await updateUserDB({
        profilePicture: resultUpload,
      });
      if (!resultUpdate) return;

      onClose();
    } catch (error) {
      customShowError({
        error,
        showToast,
      });
    } finally {
      setIsLoading(false);
    }
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
        aspect: [4, 3],
        quality: 0.1,
        base64: true,
      });
      if (result.canceled) return;

      uploadPhoto(result.assets[0]);
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
        aspect: [4, 3],
        quality: 0.1,
        base64: true,
      });
      if (result.canceled) return;

      uploadPhoto(result.assets[0]);
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
          paddingBottom: bottom + 30,
        }}
      >
        <View style={styles.header}>
          <Text style={styles.titleHeader}>Profile Image</Text>
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
          {userDB.profileImgUrl && (
            <ButtonModalTabs
              label="Remove current picture"
              Icon={IconTrashProfile}
              onPress={() => deleteProfileImage()}
              styleContainer={styles.buttonContainer}
              styleLabel={styles.labelRemove}
              isRightArrow={false}
            />
          )}
        </View>
      </View>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={colors.primary[600]} size={'large'} />
        </View>
      )}
    </BottomSheetCustom>
  );
};

export default AvatarProfileModal;
