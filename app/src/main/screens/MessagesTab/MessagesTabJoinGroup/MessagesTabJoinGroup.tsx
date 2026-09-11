import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

import colors from 'styles/colors';
import styles from './MessagesTabJoinGroup.styles';
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';
import { GroupChannel } from 'services/legacy-chat.shim';
import InputSearch from 'components/InputSearch/InputSearch';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';
import { useIntercom } from 'providers/IntercomProvider/IntercomProvider';
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import GroupCard from '../components/GroupCard/GroupCard';
import { usePostsProvider } from 'providers/PostsProvider/PostsProvider';
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';
import { GroupChannelSendBirdType } from 'providers/ChatProvider/ChatProvider.types';
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';

// backend v2
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import {
  joinGroup,
  getAllGroups,
  searchGroups,
} from 'services/supabase/supabase.social';

type MessagesTabJoinGroupProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabJoinGroup: FunctionComponent<MessagesTabJoinGroupProps> = ({
  navigation,
}) => {
  const { trackIntercom } = useIntercom();
  const [search, setSearch] = useState('');
  const [channels, setChannels] = useState<GroupChannelSendBirdType[]>([]);
  const [recommendedChannels, setRecommendedChannels] = useState<
    GroupChannel[]
  >([]);
  const [loading, setLoading] = useState(true);
  // Urls joined during THIS visit — rows light up as 'Joined' in place.
  const [justJoined, setJustJoined] = useState<string[]>([]);
  const tabBarHeight = useBottomTabBarHeight();
  const { getFilteringUserInfo } = usePostsProvider();
  const { groupChannels, getChannels } = useChatProvider();

  const getChannelsHandler = async () => {
    if (SUPABASE_ENABLED) {
      setLoading(true);
      try {
        // Server-side trigram search when the box has text; otherwise the full
        // list. searchGroups is case-insensitive and typo-tolerant (pg_trgm).
        const result = search.trim()
          ? await searchGroups(search.trim())
          : await getAllGroups();
        setChannels(result as unknown as GroupChannelSendBirdType[]);
      } catch (error) {
        if (__DEV__) console.warn('getChannelsHandler', error);
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const getRecommendedChannelsHandler = async () => {
    try {
      const allChannels = await getFilteringUserInfo();
      setRecommendedChannels(allChannels ?? []);
    } catch (error) {
      if (__DEV__) console.warn('getChannelsHandler', error);
    } finally {
      setLoading(false);
    }
  };

  const onPressJoinGroup = useCallback(
    async (channelUrl: string) => {
      if (SUPABASE_ENABLED) {
        try {
          await joinGroup(channelUrl);
          // UX (user-requested): the button lights up as 'Joined' in place —
          // no jump into the group chat.
          setJustJoined(prev => [...prev, channelUrl]);
          getChannels(); // refresh joined groups in the chat provider
          trackIntercom('join_group');
        } catch (error) {
          if (__DEV__) console.warn('onPressJoinGroup', error);
        }
        return;
      }
    },
    [trackIntercom, navigation, getChannels],
  );

  useEffect(() => {
    getChannelsHandler();
  }, [search]);

  // Recommended channels do not depend on the search text — fetch once.
  useEffect(() => {
    getRecommendedChannelsHandler();
  }, []);

  const joinedUrls = useMemo(
    () => new Set([...groupChannels.map(c => c.url), ...justJoined]),
    [groupChannels, justJoined],
  );

  // Two sections, as on web: the groups you are in, then the rest. The
  // heading above the second only earns its place once there is something
  // above it to tell it apart from — a member of nothing just sees groups.
  const { myGroups, otherGroups } = useMemo(() => {
    const all = (channels ?? []) as any[];
    return {
      myGroups: all.filter(g => joinedUrls.has(g.url)),
      otherGroups: all.filter(g => !joinedUrls.has(g.url)),
    };
  }, [channels, joinedUrls]);

  const openGroup = useCallback(
    (group: any) =>
      (navigation as any).navigate(PATHS_MESSAGES_TAB.messagesTabGroupFeed, {
        groupId: group.url,
        joined: joinedUrls.has(group.url),
      }),
    [navigation, joinedUrls],
  );

  const renderGroup = (group: any) => (
    <GroupCard
      key={group.url}
      name={group.name}
      description={group.lastMessage?.message}
      coverUrl={group.coverUrl}
      memberCount={group.memberCount ?? 0}
      joined={joinedUrls.has(group.url)}
      onPress={() => openGroup(group)}
      onJoin={() => onPressJoinGroup(group.url)}
    />
  );

  return (
    <BackgroundScreen type="messages">
      <HeaderTabScreen
        title="Groups"
        onPressLeft={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: tabBarHeight + 16 },
        ]}
      >
        <View style={styles.searchContainer}>
          <InputSearch
            search={search}
            setSearch={setSearch}
            placeholder={'Search groups'}
            styleContainer={styles.inputSearchContainer}
            styleInput={styles.inputSearch}
            iconProps={{ width: 24, height: 24, strokeWidth: 2.1 }}
            placeholderTextColor={colors.faint}
          />
        </View>
        {loading ? (
          <ActivityIndicator
            color={colors.magentaText}
            style={styles.loading}
          />
        ) : (
          <>
            {myGroups.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My groups</Text>
                {myGroups.map(renderGroup)}
              </View>
            )}

            {otherGroups.length > 0 && (
              <View style={styles.section}>
                {myGroups.length > 0 && (
                  <Text style={styles.sectionTitle}>Groups you can join</Text>
                )}
                {otherGroups.map(renderGroup)}
              </View>
            )}

            {myGroups.length === 0 && otherGroups.length === 0 && (
              <Text style={styles.empty}>
                {search.trim()
                  ? `No groups match "${search.trim()}".`
                  : 'No groups yet.'}
              </Text>
            )}

          </>
        )}
      </ScrollView>
    </BackgroundScreen>
  );
};

export default MessagesTabJoinGroup;
