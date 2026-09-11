import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import PostHomeTab from 'main/screens/HomeTab/components/PostHomeTab/PostHomeTab';
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// services
import {
  getGroupById,
  getPostsByGroup,
  joinGroup,
  leaveGroup,
} from 'services/supabase/supabase.social';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';

// providers
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// paths
import { PATHS_HOME_TAB } from 'main/navigators/paths';

// styles
import styles, { SCRIM } from './MessagesTabGroupFeed.styles';
import colors from 'styles/colors';

/**
 * One group: its cover, who is in it, and what has been posted to it.
 *
 * Mirrors the web group page. The feed uses the same post card as the
 * community wall, so a post looks and behaves identically wherever it is read
 * — likes, comments and the author tap all come with it rather than being
 * reimplemented here.
 *
 * RLS limits group posts to that group's members, so a non-member gets an
 * empty list from the server. That is shown as a join prompt rather than an
 * empty feed, which would read as a quiet group instead of a closed door.
 */
export default function MessagesTabGroupFeed() {
  const navigation = useNavigation<any>();
  const route =
    useRoute<
      RouteProp<{ params: { groupId: string; joined?: boolean } }, 'params'>
    >();
  const groupId = route.params?.groupId;

  const { getChannels } = useChatProvider();
  const { showToast } = useToastProvider();

  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const load = useCallback(async () => {
    if (!SUPABASE_ENABLED || !groupId) return;
    try {
      const [groupData, groupPosts] = await Promise.all([
        getGroupById(groupId),
        getPostsByGroup(groupId),
      ]);
      setGroup(groupData);
      setPosts(groupPosts as any[]);
      // Membership comes from the route rather than another round trip: the
      // list that opened this screen already knows.
      setJoined(Boolean(route.params?.joined));
    } catch (error) {
      if (__DEV__) console.warn('group feed load failed', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, route.params?.joined]);

  useEffect(() => {
    load();
  }, [load]);

  const onJoin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await joinGroup(groupId);
      setJoined(true);
      getChannels();
      // Posts were hidden by RLS until this moment.
      const groupPosts = await getPostsByGroup(groupId);
      setPosts(groupPosts as any[]);
      showToast({ type: 'success', message: `Joined ${group?.name ?? 'group'}` });
    } catch (error) {
      if (__DEV__) console.warn('join failed', error);
      showToast({ type: 'error', message: 'Could not join that group.' });
    } finally {
      setBusy(false);
    }
  };

  const onLeave = async () => {
    setConfirmLeave(false);
    if (busy) return;
    setBusy(true);
    try {
      await leaveGroup(groupId);
      setJoined(false);
      setPosts([]);
      getChannels();
      showToast({ type: 'success', message: `Left ${group?.name ?? 'group'}` });
    } catch (error) {
      if (__DEV__) console.warn('leave failed', error);
      showToast({ type: 'error', message: 'Could not leave that group.' });
    } finally {
      setBusy(false);
    }
  };

  const onPressPost = useCallback(
    (channelUrl: string) =>
      navigation.navigate('Home', {
        screen: PATHS_HOME_TAB.homeTabPost,
        params: { channelUrl },
      }),
    [navigation],
  );

  const renderPost = useCallback(
    ({ item }: { item: any }) => (
      <PostHomeTab post={item} onPressPost={onPressPost} />
    ),
    [onPressPost],
  );

  const header = (
    <>
      <View style={styles.hero}>
        {group?.coverUrl ? (
          <>
            <Image source={{ uri: group.coverUrl }} style={styles.cover} />
            <LinearGradient
              colors={SCRIM.colors}
              locations={SCRIM.locations}
              style={styles.scrim}
              pointerEvents="none"
            />
          </>
        ) : null}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <IconArrowLeft
            width={26}
            height={26}
            stroke={colors.heading}
            strokeWidth={2}
          />
        </TouchableOpacity>

        <View style={styles.heroText}>
          <Text style={styles.name}>{group?.name ?? ''}</Text>
          <Text style={styles.members}>
            {group?.memberCount ?? 0}{' '}
            {group?.memberCount === 1 ? 'member' : 'members'}
          </Text>
          {group?.lastMessage?.message ? (
            <Text numberOfLines={3} style={styles.description}>
              {group.lastMessage.message}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {joined ? (
          <TouchableOpacity
            disabled={busy}
            onPress={() => setConfirmLeave(true)}
            style={styles.leaveButton}
          >
            <Text style={styles.leaveText}>Leave group</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled={busy}
            onPress={onJoin}
            style={styles.joinButton}
          >
            <Text style={styles.joinText}>Join group</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  return (
    <BackgroundScreen type="home-main">
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.magentaText} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.url}
          renderItem={renderPost}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {joined
                  ? 'No posts in this group yet. Be the first.'
                  : 'Join this group to read and share its posts.'}
              </Text>
            </View>
          }
        />
      )}

      {confirmLeave && (
        <BottomSheetCustom
          onClose={() => setConfirmLeave(false)}
          snapPoints={['32%']}
          index={0}
        >
          <View style={styles.confirm}>
            <Text style={styles.confirmTitle}>
              Leave {group?.name ?? 'this group'}?
            </Text>
            <Text style={styles.confirmBody}>
              You will stop seeing its posts. Your own posts stay where they
              are — leaving does not delete what you have written for the
              people still in the group.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                onPress={() => setConfirmLeave(false)}
                style={styles.confirmCancel}
              >
                <Text style={styles.confirmCancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onLeave} style={styles.confirmLeave}>
                <Text style={styles.confirmLeaveText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetCustom>
      )}
    </BackgroundScreen>
  );
}
