import { z } from 'zod';
import { captureException } from 'services/sentry.shim';
import {
  GroupChannelHandler,
  useSendbirdChat,
} from 'services/legacy-chat.shim';
import React, {
  createContext,
  FunctionComponent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { MOCK_ENABLED } from 'mocks/mock.config';
import { SUPABASE_ENABLED, SOCIAL_STUBBED } from 'services/supabase/backend.config';
import { getMyGroupChannels } from 'services/supabase/supabase.social';
import {
  getConversationMessages,
  getMyConversations,
  resolveThreadId,
} from 'services/supabase/supabase.chat';
import { supabase, currentUserId } from 'services/supabase/client';
import {
  getMockChatChannels,
  MOCK_CHAT_MESSAGES,
  MOCK_FRIENDS,
  MOCK_USER_CHAT,
} from 'mocks/mock.sendbird';
import { useApiProvider } from 'providers/ApiProvider/ApiProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import {
  BaseMessageSendBirdType,
  GroupChannelSendBirdType,
  MemberSendBirdType,
  UserSendBirdType,
} from './ChatProvider.types';

// Structural stand-in for the removed @sendbird/chat BaseMessage type.
type BaseMessage = BaseMessageSendBirdType;

type SendbirdChatContext = {
  userChat: UserSendBirdType | null;
  groupChannels: GroupChannelSendBirdType[];
  messages: Record<string, BaseMessageSendBirdType[]>;
  members: Record<string, UserSendBirdType>;
  friends: UserSendBirdType[];
  blockedUsers: UserSendBirdType[];
  limit: number;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
  getChannels: () => Promise<void>;
  loadMessages: (channelUrl: string, limit?: number) => Promise<BaseMessage[]>;
  loadOlderMessages: (channelUrl: string, limit?: number) => Promise<number>;
  appendMessage: (channelUrl: string, msg: any) => void;
  getMember: (userId: string) => Promise<void>;
  addBlockedUser: (userId: string) => Promise<boolean>;
  removeBlockedUser: (userId: string) => Promise<boolean>;
  getFriends: () => Promise<UserSendBirdType[]>;
};

type ChatProviderProps = {
  children: React.ReactNode;
};

export type LocalSearchResult = {
  channel: GroupChannelSendBirdType;
  matchedMessages: BaseMessage[];
  nameMatched: boolean;
};

export const sendbirdChatContext = createContext({} as SendbirdChatContext);
// Message-data-only context (perf: isolates chat re-renders from the rest of
// the app). Consume via useChatMessages().
export const chatMessagesContext = createContext<{
  messages: Record<string, BaseMessageSendBirdType[]>;
}>({ messages: {} });

const ChatProvider: FunctionComponent<ChatProviderProps> = ({
  children,
}) => {
  const { api } = useApiProvider();
  const { sdk } = useSendbirdChat();
  const { userDB } = useUserDBProvider();
  const [userChat, setUserChat] = useState<UserSendBirdType | null>(null);
  const [groupChannels, setGroupChannels] = useState<
    GroupChannelSendBirdType[]
  >([]);
  const [members, setMembers] = useState<Record<string, UserSendBirdType>>({});
  const [friends, setFriends] = useState<UserSendBirdType[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<UserSendBirdType[]>([]);
  const [limit, setLimit] = useState(40);
  const [messages, setMessages] = useState<
    Record<string, BaseMessageSendBirdType[]>
  >({});
  // Ref mirror of messages so loadOlderMessages reads current state without a
  // stale closure (it needs the oldest-loaded cursor before an async fetch).
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const userID = useMemo(() => userDB?.cognitoId || null, [userDB?.cognitoId]);

  // Pure fetch (no setState) so getChannels can run it in parallel with the
  // channels queries and commit everything in a single render pass.
  const fetchSupabaseFriends = async (): Promise<UserSendBirdType[]> => {
    try {
      const me = await currentUserId(); // cached session — no auth round-trip
      if (!me) return [];
      const { data } = await supabase
        .from('friendships')
        .select(
          'status, requester:profiles!friendships_requester_id_fkey(id, first_name, display_name), addressee:profiles!friendships_addressee_id_fkey(id, first_name, display_name)',
        )
        .eq('status', 'accepted')
        .or(`requester_id.eq.${me},addressee_id.eq.${me}`);
      return (data ?? []).map((f: any) => {
        const other = f.requester?.id === me ? f.addressee : f.requester;
        return {
          userId: other?.id,
          nickname: other?.display_name || other?.first_name || 'Member',
          plainProfileUrl: '',
          isActive: true,
          metaData: { id: other?.id },
          status: 'accepted',
        } as unknown as UserSendBirdType;
      });
    } catch (error) {
      if (__DEV__) console.warn('supabase getFriends error', error);
      return [];
    }
  };

  const getFriends = async () => {
    if (SUPABASE_ENABLED) {
      const list = await fetchSupabaseFriends();
      setFriends(list);
      return list;
    }
    if (MOCK_ENABLED) {
      setFriends(MOCK_FRIENDS);
      return MOCK_FRIENDS as UserSendBirdType[];
    }
    const friendListQuery = sdk.createFriendListQuery({
      limit: 100,
    });
    try {
      const friends = (await friendListQuery.next()) as UserSendBirdType[];
      const confirmedFriends = (
        await Promise.all(
          friends.map(async friend => {
            try {
              const resultRequest = await api(
                `/users/${friend.metaData.id}/friend-requests`,
                {
                  config: {
                    method: 'GET',
                  },
                  schema: z.array(z.object({ status: z.string() })),
                },
              );
              if (!resultRequest || resultRequest.length === 0) {
                return {
                  ...friend,
                  status: null,
                };
              }

              const { status } = resultRequest[0];
              return {
                ...friend,
                status,
              };
            } catch (error) {
              if (__DEV__)
                console.warn(
                  `Error fetching friend request for ${friend.metaData.id}`,
                  error,
                );
              captureException(error);
              return {
                ...friend,
                status: null,
              };
            }
          }),
        )
      ).filter(friend => friend.status === 'accepted');

      setFriends(confirmedFriends as unknown as UserSendBirdType[]);

      return confirmedFriends as unknown as UserSendBirdType[];
    } catch (error) {
      if (__DEV__) console.warn('Error getting friends', error);
      captureException(error);
      return [];
    }
  };

  const getChannels = async () => {
    if (SUPABASE_ENABLED) {
      try {
        // Friends fetched IN PARALLEL with channels (was a sequential extra
        // round-trip after them), and all three states committed in the same
        // continuation so React 18 batches them into ONE provider update
        // instead of two/three consumer-tree re-renders.
        const [groups, conversations, friendList] = await Promise.all([
          getMyGroupChannels(),
          getMyConversations(userDB?.id),
          fetchSupabaseFriends(),
        ]);
        // Merged by ACTIVITY, not concatenated. These are two queries —
        // message threads and community groups — and simply appending one to
        // the other pinned every group below every conversation however
        // recent it was, so a group you had just created sat at the very
        // bottom of the inbox. Ordering getMyConversations fixed the threads
        // half; this fixes the list they are shown in.
        //
        // Both shapes already carry lastMessage.createdAt and createdAt in
        // milliseconds (conversationToChannel, groupToChannel), and a group
        // with no messages reports its own creation time, so one comparison
        // covers both.
        const activityOf = (c: any) =>
          c?.lastMessage?.createdAt ?? c?.createdAt ?? 0;
        const channels = [...conversations, ...groups].sort(
          (a: any, b: any) => activityOf(b) - activityOf(a),
        );
        const memberMap = channels.reduce<Record<string, UserSendBirdType>>(
          (acc: any, channel: any) => {
            (channel.members || []).forEach((m: any) => {
              if (m.userId !== userChat?.userId) acc[m.userId] = m;
            });
            return acc;
          },
          {},
        );
        setMembers(memberMap);
        setGroupChannels(channels as any);
        setFriends(friendList);
      } catch (error) {
        if (__DEV__) console.warn('supabase getChannels error', error);
      }
      return;
    }
    if (MOCK_ENABLED) {
      // Fake chat + JOINED group channels (joins during signup register via
      // joinMockGroup); members map keyed by userId.
      const channels = getMockChatChannels();
      const mockMembers = channels.reduce<Record<string, UserSendBirdType>>(
        (acc, channel) => {
          (channel.members || []).forEach((m: UserSendBirdType) => {
            if (m.userId !== MOCK_USER_CHAT.userId) acc[m.userId] = m;
          });
          return acc;
        },
        {},
      );
      setMembers(mockMembers);
      setMessages(MOCK_CHAT_MESSAGES as any);
      setGroupChannels(channels as any);
      setFriends(MOCK_FRIENDS);
      return;
    }
    const query = sdk.groupChannel.createMyGroupChannelListQuery({
      includeEmpty: true,
      limit,
      metadataKey: 'type',
      metadataValues: ['chat', 'group'],
    });

    try {
      const channels = (await query.next()) as GroupChannelSendBirdType[];
      const uniqueChannels = channels.reduce<GroupChannelSendBirdType[]>(
        (acc, channel, index) => {
          if (!channel.cachedMetaData.type) return acc;
          if (channel.cachedMetaData.type === 'delete') return acc;
          if (
            channel.members.length <= 1 &&
            !['post', 'group'].includes(channel.cachedMetaData.type)
          )
            return acc;
          if (acc.find(c => c.url === channel.url)) return acc;

          return [...acc, channel];
        },
        [],
      );
      const deletedChannels = channels.filter(
        channel => !uniqueChannels.find(c => c.url === channel.url),
      );
      if (deletedChannels.length > 0)
        await Promise.all(
          deletedChannels.map(channel => {
            if (!userChat?.userId) return;
            channel.leave();
          }),
        );
      const uniqueChannelsWithImageMembers = (await Promise.all(
        uniqueChannels.map(async channel => {
          const members = await Promise.all(
            channel.members.map(async (member: MemberSendBirdType) => {
              try {
                const allMetaData =
                  member.metaData && member.metaData.userInfo
                    ? JSON.parse(member.metaData.userInfo)
                    : {};

                return {
                  ...member,
                  metaData: {
                    ...member.metaData,
                    ...allMetaData,
                  },
                };
              } catch (error) {
                if (__DEV__) {
                  console.warn('Error getting member', error);
                  console.warn('member error:', member);
                }
                const allMetaData =
                  member.metaData && member.metaData.userInfo
                    ? JSON.parse(`${member.metaData.userInfo}"}`)
                    : {};
                captureException(error);
                return {
                  ...member,
                  metaData: {
                    ...member.metaData,
                    ...allMetaData,
                  },
                };
              }
            }),
          );
          return {
            ...channel,
            url: channel.url,
            name: channel.name,
            members,
            cachedMetaData: channel.cachedMetaData,
          };
        }),
      )) as GroupChannelSendBirdType[];

      const emptyMessages = uniqueChannelsWithImageMembers.reduce<
        Record<string, BaseMessage[]>
      >((acc, channel) => {
        return {
          ...acc,
          [channel.url]: [],
        };
      }, {});

      const uniqueMembers = uniqueChannelsWithImageMembers.reduce<
        UserSendBirdType[]
      >((acc, channel) => {
        const members = channel.members.filter(
          member => member.userId !== userChat?.userId,
        );
        const filteredMembers = members.filter(
          member => !acc.find(m => m.userId === member.userId),
        );
        return [...acc, ...filteredMembers];
      }, []);
      const updateMembers = uniqueMembers.reduce<
        Record<string, UserSendBirdType>
      >((acc, member) => {
        return {
          ...acc,
          [member.userId]: member,
        };
      }, {});

      setMembers(updateMembers);
      setMessages(emptyMessages);
      setGroupChannels(uniqueChannelsWithImageMembers);
      getFriends();
    } catch (error) {
      if (__DEV__) console.warn('getChannels error', error);
      captureException(error);
    }
  };

  const loginChat = async () => {
    if (!userID) return;

    if (SUPABASE_ENABLED) {
      // Real identity, no Sendbird: chat user mirrors the Supabase profile.
      if (userDB?.id)
        setUserChat({
          userId: userDB.id,
          nickname: userDB.displayName || userDB.firstName || 'Me',
          plainProfileUrl: '',
          isActive: true,
          metaData: { id: userDB.id },
        } as unknown as UserSendBirdType);
      return;
    }
    // Mock mode: no real Sendbird app — skip connect and use the fake chat
    // user so chat/feed/groups screens render with mock data.
    if (MOCK_ENABLED) {
      setUserChat(MOCK_USER_CHAT);
      return;
    }
    // Legacy Sendbird connect flow removed — BACKEND is only mock | supabase.
  };

  const loadMessages = async (channelUrl: string, limit = 50) => {
    if (SUPABASE_ENABLED) {
      try {
        // Group urls resolve to their (auto-created) group thread.
        const threadId = await resolveThreadId(channelUrl);
        const msgs = (await getConversationMessages(
          threadId,
          limit,
        )) as unknown as BaseMessage[];
        // Key by the URL the screen asked for so it finds its messages.
        setMessages(prev => ({ ...prev, [channelUrl]: msgs as any }));
        return msgs;
      } catch (error) {
        if (__DEV__) console.log('loadMessages(supabase) empty:', channelUrl);
        setMessages(prev => ({ ...prev, [channelUrl]: [] }));
        return [];
      }
    }
    return loadMessagesLegacy(channelUrl, limit);
  };

  /**
   * Load OLDER history (keyset). Messages are stored newest-first (inverted
   * list), so the oldest loaded is the LAST element; we fetch messages before
   * its created_at and append them to the end. Dedupes by messageId. Returns
   * how many older messages were added (0 = reached the beginning).
   */
  const loadOlderMessages = async (channelUrl: string, limit = 50) => {
    if (!SUPABASE_ENABLED) return 0;
    const current = (messagesRef.current[channelUrl] ?? []) as any[];
    if (current.length === 0) return 0;
    const oldest = current[current.length - 1];
    const before = oldest?.createdAt
      ? new Date(oldest.createdAt).toISOString()
      : undefined;
    try {
      const threadId = await resolveThreadId(channelUrl);
      const older = (await getConversationMessages(
        threadId,
        limit,
        before,
      )) as any[];
      if (!older.length) return 0;
      setMessages(prev => {
        const existing = (prev[channelUrl] ?? []) as any[];
        const seen = new Set(existing.map(m => m.messageId));
        const add = older.filter(m => !seen.has(m.messageId));
        if (!add.length) return prev;
        return { ...prev, [channelUrl]: [...existing, ...add] as any };
      });
      return older.length;
    } catch (error) {
      if (__DEV__) console.warn('loadOlderMessages error', error);
      return 0;
    }
  };

  const loadMessagesLegacy = async (channelUrl: string, limit = 50) => {
    if (SUPABASE_ENABLED) return [];
    if (SOCIAL_STUBBED) {
      const mockMsgs = (MOCK_CHAT_MESSAGES[channelUrl] ?? []) as BaseMessage[];
      setMessages(prev => ({ ...prev, [channelUrl]: mockMsgs as any }));
      return mockMsgs;
    }
    try {
      const channel = await sdk.groupChannel.getChannel(channelUrl);
      const messageQuery = channel.createPreviousMessageListQuery({
        limit,
        reverse: true,
      });
      const messages = await messageQuery.load();
      setMessages(prevMessages => ({
        ...prevMessages,
        [channelUrl]: messages,
      }));
      return messages;
    } catch (error) {
      if (__DEV__) console.warn('loadMessages error', error);
      captureException(error);
      return [];
    }
  };

  /**
   * Realtime delivery: PREPEND one incoming message (threads are stored
   * newest-first for the inverted FlatList) instead of refetching the whole
   * page per event. Dedupes by messageId (covers our own sends, which are
   * already in state from the post-send loadMessages).
   */
  const appendMessage = (channelUrl: string, msg: any) => {
    setMessages(prev => {
      const current = (prev[channelUrl] ?? []) as any[];
      if (msg?.messageId != null &&
          current.some((m: any) => m.messageId === msg.messageId))
        return prev;
      return { ...prev, [channelUrl]: [msg, ...current] as any };
    });
  };

  const getBlockedUsers = async () => {
    if (SOCIAL_STUBBED) return [];
    if (!userChat) return;

    const query = sdk.createBlockedUserListQuery();

    try {
      const blockedUsers = (await query.next()) as UserSendBirdType[];
      setBlockedUsers(blockedUsers);
      return blockedUsers;
    } catch (error) {
      if (__DEV__) console.warn('getBlockedUsers error', error);
      captureException(error);
      return [];
    }
  };

  const getMember = async (userId: string) => {
    if (SOCIAL_STUBBED) return; // members already seeded by getChannels
    const query = sdk.createApplicationUserListQuery({
      userIdsFilter: [userId],
    });

    const membersResult = (await query.next()) as UserSendBirdType[];
    const filteredMembers = membersResult.filter(
      member => members[member.userId] === undefined,
    );
    if (filteredMembers.length === 0) return;

    const membersWithImage = await Promise.all(
      filteredMembers.map(async member => {
        const allMetaData = JSON.parse(member.metaData.userInfo || '{}');

        return {
          ...member,
          metaData: {
            ...member.metaData,
            ...allMetaData,
          },
        } as UserSendBirdType;
      }),
    );

    const updateMembers = membersWithImage.reduce<
      Record<string, UserSendBirdType>
    >(
      (acc, member) => ({
        ...acc,
        [member.userId]: member,
      }),
      {},
    );

    getBlockedUsers();
    setMembers(prevMembers => ({
      ...prevMembers,
      ...updateMembers,
    }));
  };

  const addBlockedUser = async (userId: string) => {
    if (SOCIAL_STUBBED) return true;
    if (!userChat) return false;

    try {
      await sdk.blockUserWithUserId(userId);
      getBlockedUsers();
      return true;
    } catch (error) {
      if (__DEV__) console.warn('addBlockedUser error', error);
      captureException(error);
      return false;
    }
  };

  const removeBlockedUser = async (userId: string) => {
    if (SOCIAL_STUBBED) return true;
    if (!userChat) return false;

    try {
      await sdk.unblockUserWithUserId(userId);
      await getChannels();
      getBlockedUsers();
      return true;
    } catch (error) {
      if (__DEV__) console.warn('removeBlockedUser error', error);
      captureException(error);
      return false;
    }
  };

  const logoutChat = async () => {
    if (!userChat) return;
    // Legacy Sendbird disconnect removed — mock/supabase just clear the user
    // (identical to the previous SOCIAL_STUBBED branch).
    setUserChat(null);
  };

  useEffect(() => {
    if (userDB?.cognitoId) loginChat();
    else logoutChat();
  }, [userDB]);

  useEffect(() => {
    if (userChat) getChannels();
  }, [userChat?.userId, limit]);

  useEffect(() => {
    if (!userChat || SOCIAL_STUBBED) return;

    const channelHandler = new GroupChannelHandler();
    channelHandler.onChannelChanged = updatedChannel => {
      loadMessages(updatedChannel.url);
    };

    channelHandler.onChannelDeleted = channelUrl => {
      setGroupChannels(prevChannels =>
        prevChannels.filter(c => c.url !== channelUrl),
      );
    };

    sdk.groupChannel.addGroupChannelHandler(
      'GroupChannelHandler',
      channelHandler,
    );

    return () => {
      sdk.groupChannel.removeGroupChannelHandler('GroupChannelHandler');
    };
  }, [userChat]);

  // PERF: `messages` is the churny state (changes on every incoming/sent chat
  // message). It is DELIBERATELY excluded from this main context value so that
  // a message in one conversation does NOT re-render every consumer of this
  // provider app-wide (the Home feed, etc.). Message data lives in its own
  // lightweight context below; only the chat screens subscribe to it.
  const value = useMemo(
    () => ({
      userChat,
      groupChannels,
      members,
      friends,
      blockedUsers,
      limit,
      getChannels,
      setLimit,
      loadMessages,
      loadOlderMessages,
      appendMessage,
      getMember,
      addBlockedUser,
      removeBlockedUser,
      getFriends,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      userChat,
      groupChannels,
      members,
      friends,
      blockedUsers,
      limit,
      userDB,
      api,
      sdk,
    ],
  );

  // Separate, message-only context — recomputes on every message, but only
  // the chat screens consume it, so the fan-out is contained.
  const messagesValue = useMemo(() => ({ messages }), [messages]);

  return (
    <sendbirdChatContext.Provider value={value}>
      <chatMessagesContext.Provider value={messagesValue}>
        {children}
      </chatMessagesContext.Provider>
    </sendbirdChatContext.Provider>
  );
};

export const useChatProvider = () => useContext(sendbirdChatContext);
/** Message data only — subscribe here (not the main provider) to avoid
 *  re-rendering on every chat message. */
export const useChatMessages = () => useContext(chatMessagesContext);

// Sendbird UIKit container removed — the provider now renders directly.
export default ({ children }: { children: React.ReactNode }) => (
  <ChatProvider>{children}</ChatProvider>
);
