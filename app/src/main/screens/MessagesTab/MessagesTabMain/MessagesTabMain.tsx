import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';
import {
  GroupChannelSendBirdType,
  MemberSendBirdType,
} from 'providers/ChatProvider/ChatProvider.types';
import { BaseMessage } from 'services/legacy-chat.shim';

// providers
import { useChatProvider, useChatMessages } from 'providers/ChatProvider/ChatProvider';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabMain from 'components/HeaderTabMain/HeaderTabMain';
import InputSearch from 'components/InputSearch/InputSearch';
import AvatarMessagesTab from '../components/AvatarMessagesTab/AvatarMessagesTab';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { supabase } from 'services/supabase/client';
import { useActionSheet } from 'providers/ActionSheetProvider/ActionSheetProvider';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { IconTrashProfile } from 'assets/icons-auto/components';

// icons
import {
  IconChat,
  IconEdit,
  IconMessagesNotGroup,
  IconUsers,
} from 'assets/icons-auto/components';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';

// styles
import styles from './MessagesTabMain.styles';
import colors from 'styles/colors';
import { toLocalizedTimeString } from 'utils/formatDate';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useDebouncedValue } from 'utils/useDebouncedValue';
import LoadingLine from 'components/LoadingLine/LoadingLine';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';

type MessagesTabMainProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const HighlightedText: FunctionComponent<{
  text: string;
  highlight: string;
}> = ({ text, highlight }) => {
  if (!highlight) return <Text>{text}</Text>;

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} style={styles.highlight}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
};

type LocalSearchResult = {
  channel: GroupChannelSendBirdType;
  matchedMessages: BaseMessage[];
  nameMatched: boolean;
};

type ChannelRowProps = {
  result: LocalSearchResult;
  index: number;
  showResultList: boolean;
  search: string;
  userChatId: string;
  country: string;
  onRequestDelete: (channelUrl: string, name: string) => void;
  onPressTo: (
    channelUrl: string,
    isGroup?: boolean,
    targetMessageId?: string,
  ) => void;
};

// Memoized list row: per-item derivation (friend lookup, avatar url, name,
// last message) only re-runs when the row's own props change.
const ChannelRow = React.memo<ChannelRowProps>(
  ({
    result,
    index,
    showResultList,
    search,
    userChatId,
    country,
    onPressTo,
    onRequestDelete,
  }) => {
    const item = result.channel;
    const isGroup =
      item.cachedMetaData?.type === 'group' ||
      item.cachedMetaData?.type === 'recommendation';

    // get message from result
    const infoMessage = !!result.matchedMessages?.length
      ? result.matchedMessages[0]
      : item.lastMessage;
    const lastMessage =
      infoMessage?.messageType === 'file' ? 'File' : infoMessage?.message || '';
    const isHighlight = !!result.matchedMessages?.length && !!search;

    const friend = item.members.find(
      member => member.userId !== userChatId,
    ) as MemberSendBirdType | undefined;
    const imageUrl = isGroup
      ? item.coverUrl ?? ''
      : friend?.plainProfileUrl || '';
    const name = isGroup ? item.name : friend?.nickname || 'No name';

    const matchMessageId = `${result.matchedMessages[0]?.messageId ?? ''}`;

    return (
      <Swipeable
        renderRightActions={() => (
          <RectButton
            style={styles.swipeDelete}
            onPress={() => onRequestDelete(item.url, name)}
          >
            <IconTrashProfile width={22} height={22} stroke={colors.white} />
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </RectButton>
        )}
        overshootRight={false}
      >
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => onPressTo(item.url, isGroup, matchMessageId)}
      >
        <AvatarMessagesTab imageUrl={imageUrl} name={name} />
        <View
          style={[
            styles.infoContainer,
            index === 0 && !showResultList && styles.infoTopBorder,
          ]}
        >
          <View style={styles.titlesItem}>
            <Text style={styles.titleItem}>{name}</Text>
            <Text numberOfLines={1} style={styles.subtitleItem}>
              {isHighlight ? (
                <HighlightedText text={lastMessage} highlight={search.trim()} />
              ) : (
                lastMessage
              )}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Text
              style={[
                styles.dateItem,
                item.unreadMessageCount > 0 && styles.dataItemIsNew,
              ]}
            >
              {infoMessage?.createdAt
                ? toLocalizedTimeString(infoMessage?.createdAt || 0, country, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''}
            </Text>
            <View
              style={[
                styles.newMessagesContainer,
                item.unreadMessageCount === 0 && {
                  backgroundColor: 'transparent',
                },
              ]}
            >
              <Text style={styles.newMessages}>
                {item.unreadMessageCount > 0 ? item.unreadMessageCount : ''}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      </Swipeable>
    );
  },
);

const MessagesTabMain: FunctionComponent<MessagesTabMainProps> = ({
  navigation,
}) => {
  const isFocused = useIsFocused();
  const { userChat, groupChannels, limit, setLimit, getChannels } =
    useChatProvider();
  const { messages } = useChatMessages();
  const { userDB } = useUserDBProvider();
  const [search, setSearch] = useState('');
  const [filterChannels, setFilterChannel] = useState<LocalSearchResult[]>([]);
  const [showResultList, setShowResultList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { showSheet } = useActionSheet();
  const { showToast } = useToastProvider();

  const requestDeleteConversation = useCallback(
    (channelUrl: string, name: string) => {
      showSheet({
        title: `Delete conversation with ${name}?`,
        message:
          'It disappears from your list. The other person keeps the conversation and everything in it.',
        items: [
          {
            label: 'Delete conversation',
            destructive: true,
            onPress: async () => {
              const { error } = await supabase.rpc('leave_any_conversation', {
                p_conversation_id: channelUrl,
              });
              if (error) {
                showToast({
                  type: 'error',
                  message: /function|does not exist/i.test(error.message)
                    ? 'Needs migration 20260909140000_leave_any_conversation_v1.sql.'
                    : error.message,
                });
                return;
              }
              showToast({ type: 'success', message: 'Conversation deleted' });
              getChannels();
            },
          },
        ],
      });
    },
    [showSheet, showToast, getChannels],
  );

  const debouncedSearch = useDebouncedValue(search, 300);
  const searchIdRef = useRef(0);

  const searchMatchedGroups = async (
    channels: GroupChannelSendBirdType[],
    keyword: string,
    maxMessagesPerChannel = 30,
  ): Promise<LocalSearchResult[]> => {
    if (!keyword.trim()) return [];

    setIsSearching(true);
    const lowerKeyword = keyword.toLowerCase();
    const results: LocalSearchResult[] = [];

    for (const channel of channels) {
      let matchedMessages: BaseMessage[] = [];

      // 1. match name
      const isGroup =
        channel.cachedMetaData?.type === 'group' ||
        channel.cachedMetaData?.type === 'recommendation';
      const friend = channel.members.find(
        member => member.userId !== userChat?.userId,
      ) as MemberSendBirdType | undefined;
      const channelName = isGroup ? channel.name : friend?.nickname || '';

      if (
        channelName.toLowerCase().includes(lowerKeyword) &&
        (channel.cachedMetaData?.type === 'group' || channel.lastMessage)
      ) {
        results.push({
          channel,
          matchedMessages: [],
          nameMatched: true,
        });
        continue;
      }
      // 2. get latest message
      if (SUPABASE_ENABLED) {
        // Search locally cached thread messages + the list preview —
        // Sendbird's per-channel history query is gone. (Full-text server
        // search can come later as a messages RPC.)
        const cached = messages[channel.url] || [];
        matchedMessages = cached.filter(
          msg =>
            msg.messageType === 'user' &&
            msg.message?.toLowerCase().includes(lowerKeyword),
        ) as BaseMessage[];
        if (
          matchedMessages.length === 0 &&
          channel.lastMessage?.message?.toLowerCase().includes(lowerKeyword)
        ) {
          matchedMessages = [channel.lastMessage as BaseMessage];
        }
      } else {
        // Mock mode: search the cached mock thread the same way — the old
        // Sendbird history query ran against the dead-proxy SDK and silently
        // matched nothing.
        const cached = messages[channel.url] || [];
        matchedMessages = cached.filter(
          msg =>
            msg.messageType === 'user' &&
            msg.message?.toLowerCase().includes(lowerKeyword),
        ) as BaseMessage[];
      }

      if (matchedMessages.length > 0) {
        results.push({
          channel,
          matchedMessages,
          nameMatched: false,
        });
      }
    }

    setIsSearching(false);
    return results;
  };

  useEffect(() => {
    const currentSearchId = ++searchIdRef.current;

    if (!debouncedSearch.trim()) {
      setFilterChannel(
        groupChannels.map(channel => ({
          channel,
          matchedMessages: [],
          nameMatched: false,
        })),
      );
      setShowResultList(false);
      return;
    }
    searchMatchedGroups(groupChannels, debouncedSearch).then(result => {
      if (currentSearchId === searchIdRef.current) {
        setFilterChannel(result);
        setShowResultList(!!result.length);
      }
    });
  }, [groupChannels, debouncedSearch]);

  const onPressTo = useCallback(
    (channelUrl: string, isGroup = false, targetMessageId?: string) => {
      const params = { channelUrl };
      if (targetMessageId) {
        Object.assign(params, { targetMessageId });
      }

      if (isGroup)
        navigation.navigate(PATHS_MESSAGES_TAB.messagesTabChatGroup, params);
      else navigation.navigate(PATHS_MESSAGES_TAB.messagesTabChat, params);
    },
    [navigation],
  );

  const handleScrollDown = useCallback(
    ({
      nativeEvent: { layoutMeasurement, contentOffset, contentSize },
    }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const paddingToBottom = 20;
      const isEnd =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;
      if (groupChannels.length >= limit && isEnd) setLimit(limit + 20);
    },
    [groupChannels.length, limit, setLimit],
  );

  const keyExtractor = useCallback(
    (result: LocalSearchResult) => `chat-${result.channel.url}`,
    [],
  );

  const renderChannelItem: ListRenderItem<LocalSearchResult> = useCallback(
    ({ item, index }) => (
      <ChannelRow
        result={item}
        index={index}
        showResultList={showResultList}
        search={search}
        userChatId={userChat?.userId || ''}
        country={userDB?.country ?? ''}
        onPressTo={onPressTo}
        onRequestDelete={requestDeleteConversation}
      />
    ),
    [
      showResultList,
      search,
      userChat?.userId,
      userDB?.country,
      onPressTo,
      requestDeleteConversation,
    ],
  );

  useEffect(() => {
    if (isFocused) getChannels();
  }, [isFocused]);

  if (!userChat) return null;

  return (
    <BackgroundScreen type="messages">
      {/* The "Join group" button was removed from this header: it moved as the
          header laid out, and joining a group belongs on the groups tab rather
          than in the corner of the conversation list. */}
      <HeaderTabMain title="Chat" containerStyle={styles.header} />
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <InputSearch
            search={search}
            setSearch={setSearch}
            placeholder={'Search conversation'}
            styleContainer={styles.inputSearchContainer}
            styleInput={styles.inputSearch}
            iconProps={{ width: 24, height: 24, strokeWidth: 2.1 }}
            placeholderTextColor={colors.faint}
            onClear={() => setSearch('')}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.cancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
        {isSearching ? <LoadingLine /> : <View style={styles.loadingLine} />}
        {groupChannels.length > 0 ? (
          <FlatList
            data={filterChannels}
            renderItem={renderChannelItem}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            onScroll={handleScrollDown}
            ListHeaderComponent={
              showResultList ? (
                <Text style={styles.infoContainerTitle}>Results</Text>
              ) : null
            }
            ListEmptyComponent={
              <View
                style={[
                  styles.emptyListContainer,
                  styles.emptyListContainerNoResults,
                ]}
              >
                <IconMessagesNotGroup width={84} height={84} />
                <View style={styles.titlesEmptyList}>
                  <Text style={styles.titleEmptyList}>No Results</Text>
                  <Text style={styles.subtitleEmptyList}>
                    We couldn’t find anything for
                  </Text>
                  <Text style={styles.subtitleEmptyListBold}>
                    ”{search.trim()}”
                  </Text>
                  <Text style={styles.subtitleEmptyList}>
                    Try a different search.
                  </Text>
                </View>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyListContainer}>
            <IconChat width={84} height={84} />
            <View style={styles.titlesEmptyList}>
              <Text style={styles.titleEmptyList}>It's quiet here</Text>
              <Text style={styles.subtitleEmptyList}>
                Start chatting with friends or join a group{' '}
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.buttonNewChat}
          onPress={() =>
            navigation.navigate(PATHS_MESSAGES_TAB.messagesTabCreateChat)
          }
        >
          <IconEdit width={20} height={20} />
          <Text style={styles.titleButtonNewChat}>New chat</Text>
        </TouchableOpacity>
      </View>
    </BackgroundScreen>
  );
};

export default MessagesTabMain;
