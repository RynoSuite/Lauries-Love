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
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImagePickerAsset } from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';
import {
  BaseMessageSendBirdType,
  GroupChannelSendBirdType,
  UserSendBirdType,
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
import AvatarMessagesTab from '../components/AvatarMessagesTab/AvatarMessagesTab';
import OpenFileModal from '../components/OpenFileModal/OpenFileModal';

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
  resolveThreadId,
  sendChatMessage,
  sendChatAttachment,
  subscribeToConversation,
  markConversationRead,
} from 'services/supabase/supabase.chat';
import { getGroupMembers } from 'services/supabase/supabase.social';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// styles
import styles from './MessagesTabChatGroup.styles';
import colors from 'styles/colors';

import { useIntercom } from 'providers/IntercomProvider/IntercomProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { toLocalizedDateString, toLocalizedTimeString } from 'utils/formatDate';

type MessagesTabChatGroupProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabChatGroup: FunctionComponent<MessagesTabChatGroupProps> = ({
  navigation,
}) => {
  const { bottom } = useSafeAreaInsets();
  const { showKeyboard } = useKeyboardProvider();
  const { trackIntercom } = useIntercom();
  const { sendPushNotificationToServer } = usePushNotificationProvider();
  const route =
    useRoute<RouteProp<RootMessagesTabParamList, 'messages-tab-chat-group'>>();
  const {
    userChat,
    groupChannels,
    loadMessages,
    loadOlderMessages,
    appendMessage,
    getChannels,
  } = useChatProvider();
  const { messages } = useChatMessages();
  const loadingOlderRef = useRef(false);
  const reachedStartRef = useRef(false);

  const onLoadOlder = async () => {
    if (!SUPABASE_ENABLED || loadingOlderRef.current || reachedStartRef.current)
      return;
    if ((messagesChannel?.length ?? 0) < 50) return;
    loadingOlderRef.current = true;
    try {
      const added = await loadOlderMessages(route.params?.channelUrl || '');
      if (added === 0) reachedStartRef.current = true;
    } finally {
      loadingOlderRef.current = false;
    }
  };
  const { userDB } = useUserDBProvider();
  const { showToast } = useToastProvider();

  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<
    (ImagePickerAsset & { name?: string }) | null
  >(null);
  const [channel, setChannel] = useState<GroupChannelSendBirdType | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showModals, setShowModals] = useState({
    shareMedia: false,
    confirmImage: false,
  });
  const [confirmImage, setConfirmImage] = useState<ImagePickerAsset | null>(
    null,
  );
  const [isSending, setIsSending] = useState(false);
  // Synchronous re-entry lock: a fast double-tap fires the handler twice
  // BEFORE setIsSending's re-render lands, sending the attachment twice.
  const sendLockRef = useRef(false);
  const paddingFooterRef = useRef(
    new Animated.Value(showKeyboard ? 20 : bottom + 10),
  );

  const widthButtonSendRef = useRef(new Animated.Value(0));

  const flatListRef = useRef<FlatList<any>>(null);
  const hasScrollToTarget = useRef(false);

  const messagesChannel = useMemo(
    () => messages[route.params?.channelUrl || ''] || [],
    [messages, route.params?.channelUrl],
  );

  const fetchChannel = async () => {
    if (!route.params?.channelUrl) return;

    // The provider cache is the source of truth in BOTH modes (supabase:
    // group-shaped objects; mock: plain mock channels). The old mock
    // fall-through fetched from the dead-proxy SDK and overwrote the cached
    // channel with the proxy — render-crash risk.
    const findChannel = groupChannels.find(
      groupChannel => groupChannel.url === route.params?.channelUrl,
    );
    if (findChannel) setChannel(findChannel);

    if (SUPABASE_ENABLED && !findChannel) {
      // Cache miss (cold start / push deep-link): refresh the list; the
      // groupChannels catch-up effect below picks it up. Without this the
      // screen rendered `null` forever — blank screen, no back button.
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

  const renderImageDocument = useCallback(
    (item: BaseMessageSendBirdType) => {
      if (item.messageType !== 'file' || !item.type || !item.url) return null;
    
  // Opening a thread clears it, which is what takes the count off the Messages
  // tab. Keyed on the message count as well, so a reply landing while you are
  // reading does not leave the badge behind.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !route.params?.channelUrl) return;
    markConversationRead(route.params.channelUrl).catch(error => {
      if (__DEV__) console.warn('mark read failed', error);
    });
  }, [route.params?.channelUrl, messagesChannel.length]);

  return (
        <TouchableOpacity
          onPress={() =>
            setOpen({
              width: 200,
              height: 200,
              uri: item.url || '',
              mimeType: item.type || '',
              name: item.name,
            })
          }
        >
          <Image
            source={{
              uri: item.type.includes('video')
                ? thumbnails[item.messageId]
                : item.url,
              cache: 'force-cache',
            }}
            style={styles.messageImage}
          />
        </TouchableOpacity>
      );
    },
    [thumbnails],
  );

  const renderItem: ListRenderItem<BaseMessageSendBirdType> = useCallback(
    ({ item, index }) => {
    const isUser = item.sender?.userId === userChat?.userId;
    const isPrevOtherUser =
      item.sender?.userId !== messagesChannel[index - 1]?.sender?.userId;
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
            isPrevOtherUser && styles.messageContainerOtherUser,
            isNextOtherDay && styles.messageContainerOtherDay,
          ]}
        >
          {/* No avatar beside the bubble. It was a raw Image that fell back to
              a bundled empty-avatar PNG — a grey disc on every message from
              anyone without a photo — and the attribution row below already
              carries the member's chip, which shows their picture when they
              have one and their initials when they do not. Two avatars per
              message, one of them a placeholder. */}
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
            {renderImageDocument(item)}
            <Text
              style={[styles.messageText, isUser && styles.messageTextMine]}
            >
              {item.message}
            </Text>
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
        {!isUser && (
          <View style={styles.senderRow}>
            <AvatarMessagesTab
              imageUrl={item.sender?.plainProfileUrl || ''}
              name={item.sender?.nickname || ''}
              width={24}
              height={24}
            />
            <Text style={styles.name} numberOfLines={1}>
              {/* Never the userId: with no nickname that printed a raw uuid
                  under the message. */}
              {item.sender?.nickname || 'Member'}
            </Text>
          </View>
        )}
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
      `message-${item.type}-${item.messageId}`,
    [],
  );

  // channel.members is intentionally NOT populated by the group mapper (the
  // per-channel roster fan-out was a perf problem on the list screen), so
  // recipients must be resolved lazily AT SEND TIME. Before this, userIds was
  // always [] and group message notifications were never sent.
  const getGroupRecipientIds = async (): Promise<string[]> => {
    if (!channel?.url) return [];
    const myId = userChat?.metaData?.id || userChat?.userId;
    try {
      const members = await getGroupMembers(channel.url);
      return members
        .map((m: any) => m?.metaData?.id)
        .filter((id: string) => id && id !== myId) as string[];
    } catch (error) {
      if (__DEV__) console.warn('Error resolving group recipients:', error);
      return [];
    }
  };

  const sendImage = async (message: string) => {
    if (SUPABASE_ENABLED) {
      if (!channel || !confirmImage) return;
      if (sendLockRef.current) return; // sync re-entry lock (double-tap)
      sendLockRef.current = true;
      setIsSending(true);
      try {
        // Group urls resolve to their (auto-created) conversation thread.
        const threadId = await resolveThreadId(channel.url);
        const sentAtt = await sendChatAttachment(
          threadId,
          confirmImage.uri,
          confirmImage.mimeType,
        );
        // APPEND (deduped) — reloading page 1 discarded paged-in history.
        appendMessage(channel.url, sentAtt);
        if (message?.length) {
          const sentTxt = await sendChatMessage(threadId, message);
          appendMessage(channel.url, sentTxt);
        }

        const userIds = await getGroupRecipientIds();
        if (userIds.length > 0)
          sendPushNotificationToServer({
            content: '📷 Photo in group',
            notifierIds: userIds,
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
        setConfirmImage(null);
        setShowModals(state => ({ ...state, confirmImage: false }));
      }
      return;
    }
    // Mock mode: chat is read-only demo data — just dismiss the modal. (The
    // old Sendbird sendFileMessage branch ran against the dead-proxy SDK: its
    // onSucceeded never fired, so the spinner hung forever.)
    setConfirmImage(null);
    setShowModals(state => ({ ...state, confirmImage: false }));
  };

  const sendMessage = async () => {
    if (!channel || !newMessage.length) return;
    if (SUPABASE_ENABLED) {
      const body = newMessage;
      setNewMessage('');
      try {
        // Group urls resolve to their (auto-created) conversation thread;
        // the provider keys messages by the ORIGINAL group url.
        const threadId = await resolveThreadId(channel.url);
        const sent = await sendChatMessage(threadId, body);
        // APPEND (deduped) — reloading page 1 discarded paged-in history.
        appendMessage(channel.url, sent);

        const userIds = await getGroupRecipientIds();
        if (userIds.length > 0)
          sendPushNotificationToServer({
            content: 'New message in group',
            notifierIds: userIds,
            redirect: route.params?.channelUrl,
          });

        trackIntercom('send_message');
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
    // Mock mode: chat is read-only demo data — sending is a no-op.
    setNewMessage('');
  };

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
    fetchChannel();
    if (messagesChannel.length === 0 && route.params?.channelUrl)
      loadMessages(route.params?.channelUrl || '');
  }, []);

  // Supabase mode: pick the channel up from the provider cache once the
  // refreshed list arrives (fetchChannel may run before getChannels resolves,
  // e.g. on a cold start / push deep-link). Same pattern as MessagesTabChat.
  useEffect(() => {
    if (!SUPABASE_ENABLED || channel) return;
    const findChannel = groupChannels.find(
      c => c.url === route.params?.channelUrl,
    );
    if (findChannel) setChannel(findChannel);
  }, [groupChannels]);

  useEffect(() => {
    hasScrollToTarget.current = false;
  }, []);

  // Supabase realtime: resolve the group url into its conversation thread
  // once, then APPEND each incoming message to the provider thread (keyed by
  // the ORIGINAL group url; deduped by messageId — covers our own sends).
  // No refetch-per-message: a busy group chat no longer triggers a full-page
  // round-trip per event.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !route.params?.channelUrl) return;
    const channelUrl = route.params.channelUrl;
    // New group = fresh pagination state ("reached start" is per-thread).
    reachedStartRef.current = false;
    let active = true;
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        const threadId = await resolveThreadId(channelUrl);
        if (!active) return;
        unsubscribe = subscribeToConversation(threadId, msg => {
          appendMessage(channelUrl, msg);
        });
      } catch (error) {
        if (__DEV__) console.warn('Error subscribing to group thread:', error);
      }
    })();
    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
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
                onPress={() => navigation.popToTop()}
                style={styles.buttonHeader}
              >
                <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.userContainer}>
                <AvatarMessagesTab
                  imageUrl={channel.coverUrl || ''}
                  name={channel.name || ''}
                  width={47}
                  height={47}
                />
                <Text numberOfLines={1} style={styles.userName}>
                  {channel.name}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate(
                    PATHS_MESSAGES_TAB.messagesTabDetailsGroup,
                    {
                      channelUrl: channel.url,
                    },
                  )
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
                placeholder={'Message...'}
                styleContainer={styles.inputContainer}
                styleInput={styles.input}
                isHideIcon
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
            setConfirmImage(image);
          }}
        />
      )}
      {showModals.confirmImage && confirmImage && channel && (
        <ConfirmationPhotoModal
          image={confirmImage}
          user={{
            id: channel.url,
            name: channel.name,
          }}
          onClose={() => setConfirmImage(null)}
          onSend={sendImage}
        />
      )}

      {open && <OpenFileModal file={open} onClose={() => setOpen(null)} />}
    </>
  );
};

export default MessagesTabChatGroup;
