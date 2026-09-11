import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
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
import AvatarMessagesTab from 'main/screens/MessagesTab/components/AvatarMessagesTab/AvatarMessagesTab';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// services
import {
  getGroupById,
  getGroupMembers,
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
  const [members, setMembers] = useState<any[]>([]);
  const [showMembers, setShowMembers] = useState(false);

  // How many faces fit before the strip stops reading as people and starts
  // reading as a wall. The rest become a counter.
  const PREVIEW = 6;

  const load = useCallback(async () => {
    if (!SUPABASE_ENABLED || !groupId) return;
    try {
      const [groupData, groupPosts, groupMembers] = await Promise.all([
        getGroupById(groupId),
        getPostsByGroup(groupId),
        getGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setPosts(groupPosts as any[]);
      setMembers(groupMembers as any[]);
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

        {joined ? (
          <TouchableOpacity
            disabled={busy}
            onPress={() => setConfirmLeave(true)}
            style={styles.leaveOnHero}
          >
            <Text style={styles.leaveOnHeroText}>Leave</Text>
          </TouchableOpacity>
        ) : null}

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

      {members.length > 0 && (
        <View style={styles.roster}>
          {members.slice(0, PREVIEW).map((m: any) => (
            <View key={m.userId} style={styles.rosterFace}>
              <AvatarMessagesTab
                imageUrl={m.plainProfileUrl || ''}
                name={m.nickname || ''}
                width={32}
                height={32}
              />
            </View>
          ))}
          {members.length > PREVIEW && (
            <TouchableOpacity
              onPress={() => setShowMembers(true)}
              style={styles.rosterMore}
            >
              <Text style={styles.rosterMoreText}>
                +{members.length - PREVIEW} more
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!joined && (
        <View style={styles.actions}>
          <TouchableOpacity
            disabled={busy}
            onPress={onJoin}
            style={styles.joinButton}
          >
            <Text style={styles.joinText}>Join group</Text>
          </TouchableOpacity>
        </View>
      )}
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

      {showMembers && (
        <BottomSheetCustom
          onClose={() => setShowMembers(false)}
          snapPoints={['70%']}
          index={0}
        >
          <View style={styles.membersSheet}>
            <Text style={styles.membersTitle}>
              Members{' '}
              <Text style={styles.membersCount}>({members.length})</Text>
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {members.map((m: any) => (
                <View key={m.userId} style={styles.memberRow}>
                  <AvatarMessagesTab
                    imageUrl={m.plainProfileUrl || ''}
                    name={m.nickname || ''}
                    width={38}
                    height={38}
                  />
                  <Text numberOfLines={1} style={styles.memberName}>
                    {m.nickname || 'Member'}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </BottomSheetCustom>
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
