import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DocumentPickerAsset } from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';

// components
import InputSearch from 'components/InputSearch/InputSearch';

// icons
import { IconClose, IconSend } from 'assets/icons-auto/components';

// styles
import styles from './ConfirmationPdfModal.styles';
import colors from 'styles/colors';

type ConfirmationPdfModalProps = {
  document: DocumentPickerAsset;
  user: {
    id: string;
    name: string;
  };
  onClose: () => void;
  onSend: (message: string) => void;
  isOpen?: boolean;
};

const ConfirmationPdfModal: FunctionComponent<ConfirmationPdfModalProps> = ({
  onClose,
  document,
  user,
  onSend,
  isOpen = false,
}) => {
  const { bottom, top } = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [message, setMessage] = useState('');

  const isPDF = useMemo(
    () => document.mimeType === 'application/pdf',
    [document],
  );

  const fullName = useMemo(() => user.name || 'Unknown', [user]);

  const onSendHandler = () => {
    if (isOpen) {
      Linking.openURL(document.uri);
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
          {isPDF ? (
            <Pdf
              source={{ uri: document.uri, cache: true }}
              style={styles.document}
            />
          ) : (
            <View style={[styles.document, styles.notDocument]}>
              <Text style={styles.documentTitle}>{document.name}</Text>
              <Text style={styles.documentMessage}>Document is not PDF</Text>
            </View>
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

export default ConfirmationPdfModal;
