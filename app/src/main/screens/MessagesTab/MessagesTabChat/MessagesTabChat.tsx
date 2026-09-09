import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ListRenderItem,
  FlatList,
  KeyboardAvoidingView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImagePickerAsset } from 'expo-image-picker';
import { DocumentPickerAsset } from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';
import {
  BaseMessageSendBirdType,
  GroupChannelSendBirdType,
  MemberSendBirdType,
} from 'providers/ChatProvider/ChatProvider.types';

// providers
import { useKeyboardProvider } from 'providers/KeyboardProvider/KeyboardProvider';
import { useChatProvider, useChatMessages } from 'providers/ChatProvider/ChatProvider';
import { usePushNotificationProvider } from 'providers/PushNotificationProvider/PushNotificationProvider';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import InputSearch from 'components/InputSearch/InputSearch';
import ShareMediaModal from '../components/ShareMediaModal/ShareMediaModal';
import ConfirmationPhotoModal from '../components/ConfirmationPhotoModal/ConfirmationPhotoModal';
import ConfirmationPdfModal from '../components/ConfirmationPdfModal/ConfirmationPdfModal';
import AvatarMessagesTab from '../components/AvatarMessagesTab/AvatarMessagesTab';
import PhotoMediaMessagesTab from '../components/PhotoMediaMessagesTab/PhotoMediaMessagesTab';
import OpenFileModal from '../components/OpenFileModal/OpenFileModal';

// images
import defaultAvatar from 'assets/images/avatar-empty.png';

// icons
import {
  IconArrowLeft,
  IconInfo,
  IconPlus,
  IconSend,
} from 'assets/icons-auto/components';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';

// supabase (Backend V2) chat
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import {
  sendChatMessage,
  sendChatAttachment,
  subscribeToConversation,
} from 'services/supabase/supabase.chat';

// styles
import styles from './MessagesTabChat.styles';
import colors from 'styles/colors';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { toLocalizedDateString, toLocalizedTimeString } from 'utils/formatDate';

type MessagesTabChatProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabChat: FunctionComponent<MessagesTabChatProps> = ({
  navigation,
}) => {
  const isFocused = useIsFocused();
  const { bottom } = useSafeAreaInsets();
  const { showKeyboard } = useKeyboardProvider();
  const {
    userChat,
    groupChannels,
    loadMessages,
    loadOlderMessages,
    appendMessage,
    setLimit,
    getFriends,
    getChannels,
  } = useChatProvider();
  const { messages } = useChatMessages();
  const loadingOlderRef = useRef(false);
  const reachedStartRef = useRef(false);

  const onLoadOlder = async () => {
    if (!SUPABASE_ENABLED || loadingOlderRef.current || reachedStartRef.current)
      return;
    if ((messagesChannel?.length ?? 0) < 50) return; // less than a full page
    loadingOlderRef.current = true;
    try {
      const added = await loadOlderMessages(route.params?.channelUrl || '');
      if (added === 0) reachedStartRef.current = true;
    } finally {
      loadingOlderRef.current = false;
    }
  };
  const { sendPushNotificationToServer } = usePushNotificationProvider();
  const { userDB } = useUserDBProvider();
  const { showToast } = useToastProvider();
  const route =
    useRoute<RouteProp<RootMessagesTabParamList, 'messages-tab-chat'>>();
  const [channel, setChannel] = useState<GroupChannelSendBirdType | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showModals, setShowModals] = useState({
    shareMedia: false,
    confirmImage: false,
    confirmDocument: false,
  });
  const [confirm, setConfirm] = useState<{
    image: ImagePickerAsset | null;
    document: DocumentPickerAsset | null;
  }>({ image: null, document: null });
  const [open, setOpen] = useState<{
    image: (ImagePickerAsset & { name?: string }) | null;
    document: DocumentPickerAsset | null;
  }>({ image: null, document: null });
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const paddingFooterRef = useRef(
    new Animated.Value(showKeyboard ? 20 : bottom + 10),
  );
  const [isSending, setIsSending] = useState(false);
  // Synchronous re-entry lock: a fast double-tap fires the handler twice
  // BEFORE setIsSending's re-render lands, sending the attachment twice.
  const sendLockRef = useRef(false);
  const widthButtonSendRef = useRef(new Animated.Value(0));

  const flatListRef = useRef<FlatList<any>>(null);
  const hasScrollToTarget = useRef(false);

  const messagesChannel = useMemo(
    () => messages[route.params?.channelUrl || ''] || [],
    [messages, route.params?.channelUrl],
  );

  const friend: MemberSendBirdType | null = useMemo(() => {
    // My chat identity is userChat (real profile id in supabase mode, the
    // mock user in mock mode) — the Sendbird SDK is gone.
    const myUserId = userChat?.userId;
    return channel?.members.find(member => member.userId !== myUserId) || null;
  }, [channel, userChat?.userId]);

  const fetchChannel = async () => {
    if (!route.params?.channelUrl) return;

    // The provider cache is the source of truth in BOTH modes (supabase:
    // conversation/group-shaped objects; mock: plain mock channels). The old
    // mock fall-through fetched from the dead-proxy SDK and overwrote the
    // cached channel with the proxy — render-crash risk.
    const findChannel = groupChannels.find(
      channel => channel.url === route.params?.channelUrl,
    );
    if (findChannel) setChannel(findChannel);

    if (SUPABASE_ENABLED && !findChannel) {
      // Cache miss (just-created conversation / deep link): refresh the
      // list; the groupChannels effect below picks it up.
      getChannels();
    }
  };

  const animated = () => {
    Animated.timing(paddingFooterRef.current, {
      toValue: showKeyboard ? 20 : bottom + 10,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const animatedButtonSend = () => {
    Animated.timing(widthButtonSendRef.current, {
      toValue: newMessage.length ? 40 : 0,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const sendImage = async (message: string) => {
    if (SUPABASE_ENABLED) {
      if (!channel || !confirm.image) return;
      if (sendLockRef.current) return;
      sendLockRef.current = true;
      setIsSending(true);
      try {
        const sentAtt = await sendChatAttachment(
          channel.url,
          confirm.image.uri,
          confirm.image.mimeType,
        );
        appendMessage(channel.url, sentAtt);
        if (message?.length) {
          const sentTxt = await sendChatMessage(channel.url, message);
          appendMessage(channel.url, sentTxt);
        }
        if (friend?.metaData?.id)
          sendPushNotificationToServer({
            content: '📷 Photo',
            notifierIds: [friend?.metaData?.id || ''],
            redirect: route.params?.channelUrl,
          });
      } catch (error) {
        showToast({
          type: 'error',
          message: 'Photo failed to send. Please try again.',
        });
        if (__DEV__) console.warn('Error sending image:', error);
      } finally {
        sendLockRef.current = false;
        setIsSending(false);
        setConfirm(state => ({ ...state, image: null }));
        setShowModals(state => ({ ...state, confirmImage: false }));
      }
      return;
    }
    // Mock mode: chat is read-only demo data — just dismiss the modal. (The
    // old Sendbird sendFileMessage branch ran against the dead-proxy SDK: its
    // onSucceeded never fired, so the spinner hung forever.)
    setConfirm(state => ({ ...state, image: null }));
    setShowModals(state => ({ ...state, confirmImage: false }));
  };

  const sendDocument = async (message: string) => {
    if (SUPABASE_ENABLED) {
      if (!channel || !confirm.document) return;
      if (sendLockRef.current) return;
      sendLockRef.current = true;
      setIsSending(true);
      try {
        const sentAtt = await sendChatAttachment(
          channel.url,
          confirm.document.uri,
          confirm.document.mimeType,
        );
        appendMessage(channel.url, sentAtt);
        if (message?.length) {
          const sentTxt = await sendChatMessage(channel.url, message);
          appendMessage(channel.url, sentTxt);
        }
        if (friend?.metaData?.id)
          sendPushNotificationToServer({
            content: '📄 Document',
            notifierIds: [friend?.metaData?.id || ''],
            redirect: route.params?.channelUrl,
          });
      } catch (error) {
        showToast({
          type: 'error',
          message: 'Document failed to send. Please try again.',
        });
        if (__DEV__) console.warn('Error sending document:', error);
      } finally {
        sendLockRef.current = false;
        setIsSending(false);
        setConfirm(state => ({ ...state, document: null }));
        setShowModals(state => ({ ...state, confirmDocument: false }));
      }
      return;
    }
    // Mock mode: chat is read-only demo data — just dismiss the modal.
    setConfirm(state => ({ ...state, document: null }));
    setShowModals(state => ({ ...state, confirmDocument: false }));
  };

  const sendMessage = async () => {
    if (!channel || !newMessage.length) return;
    if (SUPABASE_ENABLED) {
      const body = newMessage;
      setNewMessage('');
      try {
        const sent = await sendChatMessage(channel.url, body);
        // APPEND the confirmed message (deduped against the realtime INSERT).
        // Do NOT reload page 1 here — that replaced the thread with the
        // newest 50 and silently discarded any older history the user had
        // paged in.
        appendMessage(channel.url, sent);
        if (friend?.metaData?.id)
          sendPushNotificationToServer({
            content: body,
            notifierIds: [friend?.metaData?.id || ''],
            redirect: route.params?.channelUrl,
          });
      } catch (error) {
        // Give the user their text back — it used to vanish silently.
        setNewMessage(body);
        showToast({
          type: 'error',
          message: 'Message failed to send. Please try again.',
        });
        if (__DEV__) console.warn('Error sending message:', error);
      }
      return;
    }
    // Mock mode: chat is read-only demo data — sending is a no-op. (The old
    // Sendbird sendUserMessage branch threw against plain mock objects.)
    setNewMessage('');
  };

  const getThumbnails = async () => {
    if (!route.params?.channelUrl || !messagesChannel.length) return;

    const thumbnailsVideosArray = messagesChannel.filter(
      file => file.type && file.type.includes('video'),
    );
    if (!thumbnailsVideosArray.length) return;
    try {
      const thumbnailsVideos = (
        await Promise.all(
          thumbnailsVideosArray.map(async file => {
            if (!file.url) return null;
            const thumbnails = await VideoThumbnails.getThumbnailAsync(
              file.url,
            );
            return {
              messageId: file.messageId,
              uri: thumbnails.uri,
            };
          }),
        )
      ).reduce<Record<string, string>>((acc, file) => {
        if (!file || !file.messageId) return acc;
        acc[file.messageId] = file.uri;
        return acc;
      }, {});
      setThumbnails(thumbnailsVideos);
    } catch (error) {
      if (__DEV__) console.warn('Error getting thumbnails:', error);
    }
  };

  const renderImageDocument = useCallback((item: BaseMessageSendBirdType) => {
    if (item.messageType !== 'file' || !item.type || !item.url) return null;
    if (item.type.includes('image') || item.type.includes('video'))
      return (
        <PhotoMediaMessagesTab
          messageImage={
            {
              ...item,
              url: item.type.includes('video')
                ? thumbnails[item.messageId]
                : item.url,
            } as BaseMessageSendBirdType
          }
          setOpen={() => {
            setOpen({
              image: {
                width: 200,
                height: 200,
                uri: item.url || '',
                mimeType: item.type || '',
                name: item.name || '',
              },
              document: null,
            });
          }}
          isLoading={!thumbnails[item.messageId] && item.type.includes('video')}
          styleContainer={styles.messageImage}
        />
      );

    return (
      <TouchableOpacity
        onPress={() =>
          setOpen(state => ({
            ...state,
            document: {
              uri: item.url || '',
              mimeType: item.type || '',
              name: item.name || '',
            },
          }))
        }
      >
        <View style={styles.documentContainer}>
          <Text style={styles.documentName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [thumbnails]);

  const renderItem: ListRenderItem<BaseMessageSendBirdType> = useCallback(
    ({ item, index }) => {
    const isUser = item.sender?.userId === userChat?.userId;
    const isPrevOtherDay =
      new Date(item.createdAt).getDate() !==
      new Date(messagesChannel[index - 1]?.createdAt).getDate();
    const isNextOtherDay =
      new Date(item.createdAt).getDate() !==
      new Date(messagesChannel[index + 1]?.createdAt).getDate();
    const isMinePrev =
      userChat?.userId === messagesChannel[index - 1]?.sender?.userId;
    const isMineNext =
      userChat?.userId === messagesChannel[index + 1]?.sender?.userId;

    return (
      <>
        <View
          style={[
            styles.messageContainer,
            isUser && styles.messageContainerMine,
            isMinePrev && styles.messageContainerMineNext,
            isNextOtherDay && styles.messageContainerOtherDay,
          ]}
        >
          <View
            style={[
              styles.message,
              isUser && styles.messageMine,
              !isPrevOtherDay &&
                isMinePrev &&
                isUser && {
                  borderBottomRightRadius: 6,
                },
              !isNextOtherDay &&
                isMineNext &&
                isUser && {
                  borderTopRightRadius: 6,
                },
            ]}
          >
            <View>
              {renderImageDocument(item)}
              <Text
                style={[styles.messageText, isUser && styles.messageTextMine]}
              >
                {item.message}
              </Text>
            </View>
            <Text
              style={[styles.messageDate, isUser && styles.messageDateMine]}
            >
              {toLocalizedTimeString(item.createdAt, userDB?.country ?? '', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true,
              })}
            </Text>
          </View>
        </View>
        {isNextOtherDay && (
          <Text style={styles.date}>
            {toLocalizedDateString(item.createdAt, userDB?.country ?? '', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}
      </>
    );
    },
    [messagesChannel, userChat?.userId, userDB?.country, renderImageDocument],
  );

  const keyExtractor = useCallback(
    (item: BaseMessageSendBirdType) =>
      `message-${item.messageId}-${item.sender?.userId}`,
    [],
  );

  useEffect(() => {
    animated();
  }, [showKeyboard]);

  useEffect(() => {
    animatedButtonSend();
  }, [newMessage]);

  useEffect(() => {
    getThumbnails();
  }, [messagesChannel]);

  useEffect(() => {
    if (!isFocused) return;

    fetchChannel();
    getFriends();
    if (messagesChannel.length === 0 && route.params?.channelUrl)
      loadMessages(route.params?.channelUrl || '');
  }, [isFocused]);

  useEffect(() => {
    hasScrollToTarget.current = false;
  }, []);

  // Supabase mode: pick the channel up from the provider cache once the
  // refreshed list arrives (fetchChannel may run before getChannels resolves,
  // e.g. right after creating a brand-new conversation).
  useEffect(() => {
    if (!SUPABASE_ENABLED || channel) return;
    const findChannel = groupChannels.find(
      c => c.url === route.params?.channelUrl,
    );
    if (findChannel) setChannel(findChannel);
  }, [groupChannels]);

  // Supabase realtime: APPEND each incoming message to the provider thread
  // (deduped by messageId — covers our own sends). No refetch-per-message:
  // a busy group chat no longer triggers a 100-row round-trip per event.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !route.params?.channelUrl) return;
    const channelUrl = route.params.channelUrl;
    // New conversation = fresh pagination state ("reached start" is per-thread).
    reachedStartRef.current = false;
    const unsubscribe = subscribeToConversation(channelUrl, msg => {
      appendMessage(channelUrl, msg);
    });
    return () => {
      unsubscribe();
    };
  }, [route.params?.channelUrl]);

  useEffect(() => {
    const targetMessageId = route.params?.targetMessageId ?? '';
    if (targetMessageId && flatListRef.current && !!messagesChannel.length) {
      const index = messagesChannel.findIndex(
        m => `${m.messageId}` === targetMessageId,
      );
      if (index >= 0) {
        flatListRef.current.scrollToIndex({ index, animated: true });
        hasScrollToTarget.current = true;
      }
    }
  }, [messagesChannel]);

  if (!channel) return null;

  return (
    <>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboard}
        contentContainerStyle={styles.keyboard}
      >
        <BackgroundScreen type="messages">
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  setLimit(state => state + 1);
                  navigation.goBack();
                }}
                style={styles.buttonHeader}
              >
                <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.userContainer}>
                <AvatarMessagesTab
                  imageUrl={
                    friend?.plainProfileUrl || channel.coverUrl || ''
                  }
                  width={47}
                  height={47}
                />
                <Text numberOfLines={1} style={styles.userName}>
                  {friend?.nickname || friend?.userId || channel.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  friend?.userId &&
                  navigation.navigate(PATHS_MESSAGES_TAB.messagesTabDetails, {
                    // Supabase members carry no cognitoId in metaData — their
                    // userId IS the profile id (and the members-map key).
                    cognitoId: friend.metaData?.cognitoId || friend.userId,
                    userId: friend.metaData?.id || friend.userId,
                    channelUrl: channel.url,
                  })
                }
                style={styles.buttonHeader}
              >
                <IconInfo width={24} height={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              ref={flatListRef}
              inverted
              data={messagesChannel}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={styles.messages}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              onEndReached={onLoadOlder}
              onEndReachedThreshold={0.4}
            />
            <Animated.View
              style={[
                styles.footer,
                {
                  paddingBottom: paddingFooterRef.current,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() =>
                  setShowModals(state => ({
                    ...state,
                    shareMedia: true,
                  }))
                }
                disabled={friend?.isBlockedByMe || friend?.isBlockingMe}
              >
                <IconPlus
                  width={40}
                  height={40}
                  stroke={colors.muted}
                  strokeWidth={3.333}
                />
              </TouchableOpacity>
              <InputSearch
                search={newMessage}
                setSearch={setNewMessage}
                placeholder={
                  friend?.isBlockedByMe
                    ? `You have blocked ${friend?.nickname}`
                    : friend?.isBlockingMe
                    ? `You are blocked by ${friend?.nickname}`
                    : 'Message...'
                }
                styleContainer={styles.inputContainer}
                styleInput={styles.input}
                isHideIcon
                isDisabled={friend?.isBlockedByMe || friend?.isBlockingMe}
                multiline
              />
              <Animated.View
                style={{
                  width: widthButtonSendRef.current,
                  overflow: 'hidden',
                }}
              >
                <TouchableOpacity
                  disabled={!newMessage.length}
                  style={[
                    styles.buttonSend,
                    !newMessage.length && {
                      opacity: 0,
                    },
                  ]}
                  onPress={sendMessage}
                >
                  <IconSend width={20} height={20} />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          </View>
          {isSending && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color={colors.primary[100]} />
            </View>
          )}
        </BackgroundScreen>
      </KeyboardAvoidingView>
      {showModals.shareMedia && (
        <ShareMediaModal
          onClose={() =>
            setShowModals(state => ({
              ...state,
              shareMedia: false,
            }))
          }
          onSubmittedImage={image => {
            setShowModals(state => ({
              ...state,
              shareMedia: false,
              confirmImage: true,
            }));
            setConfirm(state => ({
              ...state,
              image,
            }));
          }}
          onSubmittedDocument={document => {
            setShowModals(state => ({
              ...state,
              shareMedia: false,
              confirmDocument: true,
            }));
            setConfirm(state => ({
              ...state,
              document,
            }));
          }}
        />
      )}
      {showModals.confirmImage && confirm.image && friend && (
        <ConfirmationPhotoModal
          image={confirm.image}
          user={{
            id: friend.userId,
            name: friend.nickname,
          }}
          onClose={() => setConfirm({ image: null, document: null })}
          onSend={sendImage}
        />
      )}
      {showModals.confirmDocument && confirm.document && friend && (
        <ConfirmationPdfModal
          document={confirm.document}
          user={{
            id: friend?.userId || '',
            name: friend?.nickname || '',
          }}
          onClose={() => setConfirm({ image: null, document: null })}
          onSend={sendDocument}
        />
      )}
      {open.image && (
        <OpenFileModal
          file={open.image}
          onClose={() => setOpen({ image: null, document: null })}
        />
      )}
      {open.document && (
        <OpenFileModal
          file={open.document}
          onClose={() => setOpen({ image: null, document: null })}
        />
      )}
    </>
  );
};

export default MessagesTabChat;
