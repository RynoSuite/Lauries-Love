import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImagePickerAsset } from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ResizeMode } from 'expo-av';
import { useVideoPlayer, VideoView } from 'expo-video';

// components
import InputSearch from 'components/InputSearch/InputSearch';

// icons
import { IconClose, IconSend } from 'assets/icons-auto/components';

// styles
import styles from './ConfirmationPhotoModal.styles';
import colors from 'styles/colors';

type ConfirmationPhotoModalProps = {
  image: ImagePickerAsset;
  user: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSend: (message: string) => void;
  isOpen?: boolean;
};

const ConfirmationPhotoModal: FunctionComponent<
  ConfirmationPhotoModalProps
> = ({ onClose, image, user, onSend, isOpen = false }) => {
  const { bottom, top } = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [message, setMessage] = useState('');

  const isVideo = useMemo(
    () => image.mimeType?.includes('video') || image.type?.includes('video'),
    [image],
  );

  const player = isVideo
    ? useVideoPlayer(image.uri, player => {
        player.volume = 1.0;
        player.loop = true;
        player.play();
      })
    : null;

  const fullName = useMemo(() => user.name || 'Unknown', [user]);

  const onSendHandler = () => {
    if (isOpen) {
      Linking.openURL(image.uri);
      onClose();
      return;
    } else onSend(message);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsModalVisible(true);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (!isModalVisible) return null;
  return (
    <Modal visible transparent>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboard}
        contentContainerStyle={styles.keyboard}
      >
        <ScrollView
          scrollEnabled={false}
          contentContainerStyle={[
            styles.container,
            {
              paddingTop: top,
              paddingBottom: bottom,
            },
          ]}
        >
          {isVideo && player ? (
            <VideoView
              player={player}
              nativeControls={false}
              contentFit={ResizeMode.CONTAIN}
              style={[styles.image]}
            />
          ) : (
            <Image
              source={{ uri: image.uri, cache: 'force-cache' }}
              style={styles.image}
              resizeMode="contain"
            />
          )}
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeButton,
              {
                top: top,
              },
            ]}
          >
            <View style={styles.iconCloseContainer}>
              <IconClose
                width={28}
                height={28}
                stroke={colors.body}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.857}
              />
            </View>
          </TouchableOpacity>
          <View
            style={[
              styles.footer,
              {
                paddingBottom: bottom + 20,
              },
            ]}
          >
            {!isOpen && (
              <InputSearch
                search={message}
                setSearch={setMessage}
                placeholder="Add a caption..."
                styleContainer={styles.inputContainer}
                styleInput={styles.input}
                isHideIcon
              />
            )}
            <View style={styles.footerButtons}>
              {!isOpen && (
                <View style={styles.userContainer}>
                  <Text style={styles.userTitle}>{fullName}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.buttonSend}
                onPress={onSendHandler}
              >
                <View
                  style={[
                    styles.iconButtonSend,
                    isOpen && styles.iconButtonText,
                  ]}
                >
                  {isOpen ? (
                    <Text style={styles.iconButtonSendText}>Download</Text>
                  ) : (
                    <IconSend width={24} height={24} />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ConfirmationPhotoModal;
