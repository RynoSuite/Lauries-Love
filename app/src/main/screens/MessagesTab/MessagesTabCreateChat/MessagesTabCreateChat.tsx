import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';
import { UserSendBirdType } from 'providers/ChatProvider/ChatProvider.types';

// providers
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';
import InputSearch from 'components/InputSearch/InputSearch';
import ListFriendsMessageTab from '../components/ListFriendsMessageTab/ListFriendsMessageTab';

// icons
import {
  IconArrowRight,
  IconEmptyChats,
  IconUsersGroup,
} from 'assets/icons-auto/components';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';

// styles
import styles from './MessagesTabCreateChat.styles';
import colors from 'styles/colors';

// supabase (Backend V2) chat
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { findOrCreateDirectConversation } from 'services/supabase/supabase.chat';

type MessagesTabCreateChatProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

type FriendWithStatus = UserSendBirdType & {
  status?: 'pending' | 'accepted' | undefined;
};

const MessagesTabCreateChat: FunctionComponent<MessagesTabCreateChatProps> = ({
  navigation,
}) => {
  const isFocused = useIsFocused();
  const { getChannels, getFriends: getFriendsProvider } =
    useChatProvider();
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [limit, setLimit] = useState(100);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnd, setIsEnd] = useState(true);

  const getFriends = async () => {
    setIsLoading(true);
    if (SUPABASE_ENABLED) {
      // Supabase mode: accepted friends come from the provider (friendships
      // table) — the Sendbird friend-list query and per-friend status calls
      // don't apply.
      try {
        const list = await getFriendsProvider();
        setFriends(list as FriendWithStatus[]);
      } catch (error) {
        if (__DEV__) console.warn('Error getting friends', error);
      } finally {
        setIsEnd(false);
        setIsLoading(false);
      }
      return;
    }
  };

  const onSelectFriend = async (userId: string) => {
    if (SUPABASE_ENABLED) {
      // Supabase mode: userId IS the profile id; the conversation id plays
      // the role of channel.url.
      try {
        const conversationId = await findOrCreateDirectConversation(userId);
        getChannels();
        return navigation.navigate(PATHS_MESSAGES_TAB.messagesTabChat, {
          channelUrl: conversationId,
          userId,
        });
      } catch (error) {
        if (__DEV__) console.warn('Error creating channel', error);
      }
      return;
    }
  };

  // Search filtering happens locally: fetching friends (plus one status
  // request per friend) on every keystroke is unnecessary network work.
  const filteredFriends = useMemo(
    () =>
      friends.filter(
        friend =>
          friend.nickname.toLowerCase().includes(search.toLowerCase()) &&
          friend.status !== 'pending',
      ),
    [friends, search],
  );

  const handleScrollDown = ({
    nativeEvent: { layoutMeasurement, contentOffset, contentSize },
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const paddingToBottom = 20;
    const isEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    if (filteredFriends.length >= limit && isEnd) setLimit(limit + 20);
  };

  useEffect(() => {
    if (!isFocused) return;
    getFriends();
  }, [limit, isFocused]);

  return (
    <BackgroundScreen type="messages">
      <HeaderTabScreen
        title="New Chat"
        onPressLeft={() => navigation.goBack()}
      />
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <InputSearch
              search={search}
              setSearch={setSearch}
              placeholder={'Search friend'}
              styleContainer={styles.inputSearchContainer}
              styleInput={styles.inputSearch}
              iconProps={{ width: 24, height: 24, strokeWidth: 2.1 }}
              placeholderTextColor={colors.faint}
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
          <TouchableOpacity
            style={styles.createButton}
            onPress={() =>
              navigation.navigate(PATHS_MESSAGES_TAB.messagesTabCreateGroup)
            }
          >
            <View style={styles.iconCreateButton}>
              <IconUsersGroup width={24} height={24} />
            </View>
            <Text style={styles.titleCreateButton}>Create a group chat</Text>
            <IconArrowRight
              width={18}
              height={18}
              stroke={colors.heading}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
        {isLoading && isEnd ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size={'large'} color={colors.heading} />
          </View>
        ) : filteredFriends.length > 0 || search.length > 0 ? (
          <ListFriendsMessageTab
            title={'Suggested friends to message'}
            titleEmptyList={search.length > 0 ? 'No friends found' : null}
            friends={filteredFriends}
            onSelect={selectUser => onSelectFriend(selectUser.userId)}
            handleScrollDown={handleScrollDown}
          />
        ) : (
          <View style={styles.emptyListContainer}>
            <IconEmptyChats width={89} height={89} />
            <View style={styles.titlesEmptyList}>
              <Text style={styles.titleEmptyList}>No results found</Text>
              <Text style={styles.subtitleEmptyList}>
                Try searching for a friend or users
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </BackgroundScreen>
  );
};

export default MessagesTabCreateChat;
