import { ScrollView, View } from 'react-native';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import colors from 'styles/colors';
import styles from './MessagesTabJoinGroup.styles';
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';
import { GroupChannel } from 'services/legacy-chat.shim';
import InputSearch from 'components/InputSearch/InputSearch';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';
import { useIntercom } from 'providers/IntercomProvider/IntercomProvider';
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import ListChannelsMessageTab from '../components/ListChannelsMessageTab/ListChannelsMessageTab';
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

  const onPressCreateGroup = useCallback(
    () => navigation.navigate(PATHS_MESSAGES_TAB.messagesTabCreateGroup),
    [navigation],
  );

  useEffect(() => {
    getChannelsHandler();
  }, [search]);

  // Recommended channels do not depend on the search text — fetch once.
  useEffect(() => {
    getRecommendedChannelsHandler();
  }, []);

  return (
    <BackgroundScreen type="messages">
      <HeaderTabScreen
        title="Join Group"
        onPressLeft={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.searchContainer}>
          <InputSearch
            search={search}
            setSearch={setSearch}
            placeholder={'Search group'}
            styleContainer={styles.inputSearchContainer}
            styleInput={styles.inputSearch}
            iconProps={{ width: 24, height: 24, strokeWidth: 2.1 }}
            placeholderTextColor={colors.faint}
          />
        </View>
        <View>
          <ListChannelsMessageTab
            channels={recommendedChannels}
            onSelect={onPressJoinGroup}
            isLoading={loading}
            onPressCreateGroup={onPressCreateGroup}
            joinedUrls={[...groupChannels.map(c => c.url), ...justJoined]}
          />
        </View>
        <View>
          <ListChannelsMessageTab
            title="Other Groups chats"
            channels={channels}
            onSelect={onPressJoinGroup}
            isLoading={loading}
            onPressCreateGroup={onPressCreateGroup}
            joinedUrls={[...groupChannels.map(c => c.url), ...justJoined]}
          />
        </View>
      </ScrollView>
    </BackgroundScreen>
  );
};

export default MessagesTabJoinGroup;
