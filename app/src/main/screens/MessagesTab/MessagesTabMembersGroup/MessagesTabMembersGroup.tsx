import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';

// types
import {
  GroupChannelSendBirdType,
  UserSendBirdType,
} from 'providers/ChatProvider/ChatProvider.types';
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';

// providers
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';

// backend v2
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { getConversationMembers } from 'services/supabase/supabase.chat';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import ListFriendsMessageTab from '../components/ListFriendsMessageTab/ListFriendsMessageTab';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';

// styles
import styles from './MessagesTabMembersGroup.styles';

type MessagesTabMembersGroupProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabMembersGroup: FunctionComponent<
  MessagesTabMembersGroupProps
> = ({ navigation }) => {
  const route =
    useRoute<
      RouteProp<RootMessagesTabParamList, 'messages-tab-members-group'>
    >();
  const { friends: providerFriends, userChat } = useChatProvider();
  const [channel, setChannel] = useState<GroupChannelSendBirdType | null>(null);
  const [friends, setFriends] = useState<UserSendBirdType[]>([]);
  const [limit, setLimit] = useState(20);

  // There is no Sendbird connection — my chat identity is userChat (profile id).
  const myUserId = userChat?.userId;

  const members = useMemo(
    () =>
      channel?.members?.filter(member => member.userId !== myUserId) || [],
    [channel, myUserId],
  );

  const getFriends = async () => {
    if (SUPABASE_ENABLED) {
      // Friends already live on the provider (Supabase-backed); no SDK query.
      setFriends(providerFriends || []);
      return;
    }
  };

  const getCurrentChannel = async () => {
    if (!route.params?.channelUrl) return;

    if (SUPABASE_ENABLED) {
      // Supabase mode: members come straight from group_members (legacy
      // member shape: userId/nickname/plainProfileUrl/metaData.id/role).
      try {
        const groupMembers = await getConversationMembers(
          route.params.channelUrl,
        );
        setChannel({
          url: route.params.channelUrl,
          members: groupMembers,
          memberCount: groupMembers.length,
        } as unknown as GroupChannelSendBirdType);
      } catch (error) {
        if (__DEV__) console.warn('Error fetching group members:', error);
      }
      return;
    }
  };

  const addFriend = async (_userId: string) => {
    // Friend requests don't go through the dead Sendbird proxy — no-op.
    if (SUPABASE_ENABLED) return;
  };

  const handleScrollDown = ({
    nativeEvent: { layoutMeasurement, contentOffset, contentSize },
  }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const paddingToBottom = 20;
    const isEnd =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    if (members.length >= limit && isEnd) setLimit(limit + 20);
  };

  // providerFriends is in the deps because in Supabase mode the provider
  // loads friends asynchronously after this screen mounts.
  useEffect(() => {
    getFriends();
  }, [limit, providerFriends]);

  // The channel does not depend on the friends pagination limit — fetch once.
  useEffect(() => {
    getCurrentChannel();
  }, []);

  return (
    <BackgroundScreen type="messages">
      <View style={styles.container}>
        <HeaderTabScreen
          title="Members"
          onPressLeft={() => navigation.goBack()}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lists}
          onScroll={handleScrollDown}
        >
          <ListFriendsMessageTab
            title={'In this conversation'}
            friends={members}
            onSelect={selectedFriend => addFriend(selectedFriend.userId)}
            isFullHeight
            selectedUsers={friends}
            isFriends
          />
        </ScrollView>
      </View>
    </BackgroundScreen>
  );
};

export default MessagesTabMembersGroup;
