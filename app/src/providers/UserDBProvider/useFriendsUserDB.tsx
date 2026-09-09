import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { z } from 'zod';

// types
import { UserSendBirdType } from 'providers/ChatProvider/ChatProvider.types';
import { UserDBType } from './UserDBProvider.types';

// providers
import { useApiProvider } from 'providers/ApiProvider/ApiProvider';
import { useUserDBProvider } from './UserDBProvider';
import { usePostsProvider } from 'providers/PostsProvider/PostsProvider';
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';

// utils
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { publicUrlFor } from 'services/supabase/supabase.storage';

// constants
import { DEFAULT_ERROR_NOT_FOUND_USER_SENDBIRD } from 'providers/ChatProvider/ChatProvider.constants';

type FriendsUserDBProps = {
  friendId: string;
  friendCognitoId: string;
  navigation?: NativeStackNavigationProp<any>;
};

const useFriendsUserDB = ({
  friendId,
  friendCognitoId,
  navigation,
}: FriendsUserDBProps) => {
  const { api } = useApiProvider();
  const { userDB, getOnlyUserDBById } = useUserDBProvider();
  const { getFriends } = useChatProvider();
  const { sendNotification } = usePostsProvider();
  const [selectUserSendbird, setSelectUserSendbird] =
    useState<UserSendBirdType | null>(null);
  const [selectUserDB, setSelectUserDB] = useState<UserDBType | null>(null);
  const [status, setStatus] = useState<'pending' | 'accepted' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);

  const isPending = useMemo(() => status === 'pending', [status]);
  const isAccepted = useMemo(() => status === 'accepted', [status]);
  const isCurrentUser = useMemo(
    () => userDB?.id === friendId,
    [userDB, friendId],
  );

  const sendFriendNotification = async () => {
    if (!userDB || !friendId) return null;

    setIsLoading(true);
    try {
      const response = await sendNotification({
        notifierId: friendId,
        senderId: userDB.id,
        entityType: 'NEW_FRIEND_REQUEST',
      });

      return response;
    } catch (error) {
      if (__DEV__) console.warn('Error sending notification', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDB = async (id: string) => {
    try {
      const userDB = await getOnlyUserDBById(id);
      return userDB;
    } catch (error) {
      if (__DEV__) console.warn('getUser error', error);
      return null;
    }
  };

  const getIsFriend = async (_userId: string) => {
    // Friendship state comes from the friend-requests API in supabase mode
    // (getRequestedFriend sets `status` = accepted); mock mode has no friend
    // store. The old Sendbird fall-through queried the dead-proxy SDK and
    // setIsFriend(proxy) made isFriend permanently truthy in mock mode.
    return;
  };

  const getUserSendbird = async () => {
    if (SUPABASE_ENABLED) {
      // Load the friend's profile straight from Supabase (friendId is the
      // profile id) — no Sendbird user query.
      try {
        const targetId = friendId || friendCognitoId;
        const userDB = targetId ? await getUserDB(targetId) : null;
        if (userDB) {
          setSelectUserSendbird({
            userId: userDB.id,
            nickname: userDB.displayName || userDB.firstName || 'Member',
            plainProfileUrl: '',
            isActive: true,
            metaData: { id: userDB.id },
          } as unknown as UserSendBirdType);
          setSelectUserDB({
            ...userDB,
            profileImgUrl: userDB.profilePicture
              ? publicUrlFor('avatars', userDB.profilePicture)
              : null,
          });
        }
      } catch (error) {
        if (__DEV__) console.warn('getUser error', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    // Mock mode: resolve through the mock users API the same way — the old
    // Sendbird user query ran against the dead-proxy SDK (JSON.parse threw,
    // the lookup silently failed and selectUserSendbird was never set).
    try {
      const targetId = friendId || friendCognitoId;
      const userDB = targetId ? await getUserDB(targetId) : null;
      if (!userDB) {
        Alert.alert('Error', DEFAULT_ERROR_NOT_FOUND_USER_SENDBIRD, [
          { text: 'OK', onPress: () => navigation?.goBack() },
        ]);
        return;
      }
      setSelectUserSendbird({
        userId: userDB.id,
        nickname: userDB.displayName || userDB.firstName || 'Member',
        plainProfileUrl: '',
        isActive: true,
        metaData: { id: userDB.id },
      } as unknown as UserSendBirdType);
      setSelectUserDB({ ...userDB, profileImgUrl: null });
    } catch (error) {
      if (__DEV__) console.warn('getUser error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRequestedFriend = async () => {
    // Your own profile has no friendship to look up — but the early return
    // used to skip the finally below, which is the only place isLoading is
    // ever cleared. The result was a button stuck on "Loading..." forever on
    // your own profile. Nothing to fetch still means nothing to wait for.
    if (!friendId || isCurrentUser) {
      setIsLoading(false);
      return;
    }

    try {
      const result = await api(`/users/${friendId}/friend-requests`, {
        config: {
          method: 'GET',
        },
        schema: z.array(z.object({ status: z.string() })),
      });
      if (!result || result.length === 0) {
        setStatus(null);
        return;
      }

      const { status } = result[0];
      setStatus(status as 'pending' | 'accepted');
    } catch (error) {
      if (__DEV__) console.warn('Error getting requested friend', error);
    } finally {
      getUserSendbird();
    }
  };

  const addFriend = async () => {
    setIsLoading(true);
    try {
      const response = await api(`/users/${friendId}/friend-requests`, {
        config: {
          method: 'POST',
          data: {
            id: friendId,
          },
        },
        schema: z.object({
          id: z.string(),
          active: z.boolean(),
          status: z.enum(['pending', 'accepted']),
          sender: z
            .object({
              id: z.string(),
            })
            .optional(),
        }),
      });
      if (!response) return { statusCode: 400 };

      setStatus(response.status);
      return { statusCode: 201 };
    } catch (error) {
      if (__DEV__) console.warn('Error adding friend', error);
      return { statusCode: 400 };
    } finally {
      setIsLoading(false);
    }
  };

  // Sendbird's separate friend list is gone — the friendships table is the
  // single source of truth; nothing extra to confirm.
  const confirmFriend = async () => {};

  const removeFriend = async () => {
    setIsLoading(true);
    try {
      const response = await api(`/users/${friendId}/friend-requests`, {
        config: {
          method: 'DELETE',
        },
        schema: z.any(),
      });
      if (!response) return { statusCode: 400 };

      return { statusCode: 204 };
    } catch (error) {
      if (__DEV__) console.warn('Error removing friend', error);
      return { statusCode: 400 };
    } finally {
      setIsLoading(false);
    }
  };

  const handleFriend = async () => {
    setIsLoading(true);
    try {
      if (!isAccepted && !isFriend) {
        const { statusCode } = await addFriend();
        if (statusCode !== 201) return;

        await getRequestedFriend();
        await sendFriendNotification();
        return;
      }
      const { statusCode } = await removeFriend();
      if (statusCode !== 204) return;

      await getUserSendbird();
      return;
    } catch (error) {
      if (__DEV__) console.warn('Error handling friend', error);
    } finally {
      setIsLoading(false);
      getRequestedFriend();
      getFriends();
    }
  };

  useEffect(() => {
    if (friendId.length > 0) getRequestedFriend();
  }, [friendId]);

  return {
    status,
    isLoading,
    isPending,
    isFriend,
    isAccepted,
    isCurrentUser,
    selectUserSendbird,
    selectUserDB,
    handleFriend,
    confirmFriend,
  };
};

export default useFriendsUserDB;
