import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DocumentPickerAsset } from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImagePickerAsset } from 'expo-image-picker';
import { ResizeMode } from 'expo-av';
import { useVideoPlayer, VideoView } from 'expo-video';
import Pdf from 'react-native-pdf';
import * as Sharing from 'expo-sharing';

// icons
import {
  IconArrowLeft,
  IconChatUpload,
  IconDownload,
} from 'assets/icons-auto/components';

// styles
import styles from './OpenFileModal.styles';
import colors from 'styles/colors';

type OpenFileModalProps = {
  file: DocumentPickerAsset | (ImagePickerAsset & { name?: string });
  onClose: () => void;
};

const OpenFileModal: FunctionComponent<OpenFileModalProps> = ({
  file,
  onClose,
}) => {
  const { bottom, top } = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(
    file.mimeType?.includes('image') ||
      file.mimeType?.includes('video') ||
      false,
  );

  const type = useMemo(() => {
    if (file.mimeType?.includes('pdf')) return 'pdf';
    if (file.mimeType?.includes('image')) return 'image';
    if (file.mimeType?.includes('video')) return 'video';
    return 'Unknown';
  }, [file.mimeType]);

  const player =
    type === 'video'
      ? useVideoPlayer(file.uri, player => {
          player.volume = 1.0;
          player.loop = true;
          player.play();
        })
      : null;

  const fullName = useMemo(
    () =>
      file.name?.split('.').shift() ||
      file.uri.split('/').pop()?.split('.').shift() ||
      'Unknown',
    [file.name, file.uri],
  );

  const component = useMemo(() => {
    if (type === 'pdf')
      return (
        <Pdf
          source={{ uri: file.uri, cache: true }}
          style={[styles.document, styles.documentLoad]}
        />
      );
    if (type === 'image')
      return (
        <Image
          source={{ uri: file.uri }}
          style={[styles.document, !loading && styles.documentLoad]}
          resizeMode={ResizeMode.CONTAIN}
          onLoadEnd={() => setLoading(false)}
        />
      );
    if (type === 'video' && player)
      return (
        <VideoView
          player={player}
          nativeControls={false}
          contentFit={ResizeMode.CONTAIN}
          style={[styles.document, !loading && styles.documentLoad]}
        />
      );
    return (
      <View
        style={[
          styles.document,
          styles.notDocument,
          !loading && styles.documentLoad,
        ]}
      >
        <Text style={styles.documentTitle}>{fullName}</Text>
        <Text style={styles.documentMessage}>Document is not PDF</Text>
      </View>
    );
  }, [file.uri, fullName, loading, player, type]);

  const onSharingHandler = async () => {
    try {
      await Sharing.shareAsync(file.uri);
    } catch (error) {
      if (__DEV__) console.warn('Error sharing file', error);
    } finally {
      onClose();
    }
  };

  const onDownloadHandler = async () => {
    try {
      await Linking.openURL(file.uri);
    } catch (error) {
      if (__DEV__) console.warn('Error downloading file', error);
    } finally {
      onClose();
    }
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
      <View
        style={[
          styles.header,
          {
            paddingTop: top,
          },
        ]}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <IconArrowLeft
            width={28}
            height={28}
            stroke={colors.heading}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {fullName}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, styles.closeButtonHidden]}
        >
          <IconArrowLeft
            width={28}
            height={28}
            stroke={colors.heading}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={styles.container}
      >
        {loading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={colors.heading} />
          </View>
        )}
        {component}
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: bottom + 20,
          },
        ]}
      >
        <View style={styles.footerButtons}>
          <TouchableOpacity
            onPress={onSharingHandler}
            style={styles.buttonFooter}
          >
            <IconChatUpload width={24} height={24} fill={colors.heading} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDownloadHandler}
            style={styles.buttonFooter}
          >
            <IconDownload
              width={24}
              height={24}
              stroke={colors.heading}
              strokeWidth={2.2}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default OpenFileModal;
