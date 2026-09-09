import { useIsFocused, CommonActions, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  InteractionManager,
} from 'react-native';

import colors from 'styles/colors';
import styles from './HomeTabMain.styles';
import { PATHS_HOME_TAB } from 'main/navigators/paths';
import LoadingLine from 'components/LoadingLine/LoadingLine';
import PostHomeTab from '../components/PostHomeTab/PostHomeTab';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import ThreeButtonsHomeTab from '../components/ThreeButtonsHomeTab/ThreeButtonsHomeTab';
import { RootHomeTabParamList } from 'main/navigators/HomeTabStacks/HomeTabStacks.types';
import TaraStoryPostHomeTab from '../components/TaraStoryPostHomeTab/TaraStoryPostHomeTab';
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';
import { usePostsProvider } from 'providers/PostsProvider/PostsProvider';
import { GroupChannelSendBirdType } from 'providers/ChatProvider/ChatProvider.types';
import NotificationButtonHomeTab from '../components/NotificationButtonHomeTab/NotificationButtonHomeTab';
import {
  IconClock,
  IconIntercom,
  IconMessagesNotGroup,
  IconPlus,
  IconTabHeart,
} from 'assets/icons-auto/components';
import { useIntercom } from 'providers/IntercomProvider/IntercomProvider';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import {
  searchPosts as searchPostsRemote,
  getPostsByHashtag,
} from 'services/supabase/supabase.social';
import InputSearch from 'components/InputSearch/InputSearch';
import { useDebouncedValue } from 'utils/useDebouncedValue';

type HomeTabMainProps = {
  navigation: NativeStackNavigationProp<RootHomeTabParamList>;
};

const HomeTabMain: FunctionComponent<HomeTabMainProps> = ({ navigation }) => {
  const isFocused = useIsFocused();
  const route = useRoute();
  const { friends, groupChannels } = useChatProvider();
  const { userChat } = useChatProvider();
  const { checkGeoLocationCity } = useUserDBProvider();
  const { openIntercom, unreadCount } = useIntercom();
  const { loadingStorage, loadingServer, posts, getPosts, comments } =
    usePostsProvider();
  const [selectType, setSelectType] = useState<'posts' | 'friends' | 'groups'>(
    'posts',
  );
  const [selectTime, setSelectTime] = useState<'trending' | 'new' | null>(null);

  const listRef = useRef<FlatList>(null);
  const scrollOffsetRef = useRef(0);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  // Deep-link from a tapped #hashtag (post detail) -> prefill the community
  // search so the results page shows matching posts.
  const initialSearch = (route.params as any)?.initialSearch as
    | string
    | undefined;
  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);
  const [showResultPage, setShowResultPage] = useState(false);
  const [searchPosts, setSearchPosts] = useState<GroupChannelSendBirdType[]>(
    [],
  );

  const groups = useMemo(() => {
    return groupChannels.filter(channel => {
      return (
        channel.cachedMetaData?.type === 'group' ||
        channel.cachedMetaData?.type === 'recommendation'
      );
    });
  }, [groupChannels]);

  const groupMembers = useMemo(() => {
    const allMembers = groupChannels.flatMap(channel => channel.members || []);

    const uniqueMembersMap = new Map<string, { userId: string }>();

    for (const member of allMembers) {
      if (!uniqueMembersMap.has(member.userId)) {
        uniqueMembersMap.set(member.userId, member);
      }
    }

    return Array.from(uniqueMembersMap.values());
  }, [groups]);

  const showPosts = useMemo(() => {
    const selectedPosts =
      selectType === 'posts'
        ? posts
        : selectType === 'friends'
        ? posts.filter(
            post =>
              post.creator?.userId &&
              friends
                .map(friend => friend.userId)
                .includes(post.creator.userId),
          )
        : SUPABASE_ENABLED
        ? posts.filter(post => {
            // Backend V2: the Groups tab = posts shared to groups/community
            // audiences (visibility 'group'), not just posts by group members.
            try {
              const meta = post.data ? JSON.parse(post.data) : {};
              return meta.visibility === 'group';
            } catch {
              return false;
            }
          })
        : posts.filter(
            post =>
              post.creator?.userId &&
              groupMembers
                .map(member => member.userId)
                .includes(post.creator.userId),
          );

    const postsWithAmount = selectedPosts
      .filter(post => post.creator !== null)
      .map(post => {
        const amountMessage = comments[post.url]?.length || 0;
        const amountReaction =
          comments[post.url]?.length > 0
            ? comments[post.url][0].reactions?.find(
                reaction => reaction.key === 'smile',
              )?.sampledUserIds?.length || 0
            : 0;
        return {
          ...post,
          url: post.url,
          amountMessage,
          amountReaction,
          createdAt: post.createdAt,
        };
      }) as GroupChannelSendBirdType[];

    if (selectTime === 'trending') {
      // Parse each post's data once (instead of twice per sort comparison)
      const trendingScoreCache = new Map<string, number>();
      const getTrendingScore = (item: GroupChannelSendBirdType) => {
        const cached = trendingScoreCache.get(item.url);
        if (cached !== undefined) return cached;
        const commentQty = JSON.parse(item.data).commentQty || 0;
        const score = commentQty + commentQty;
        trendingScoreCache.set(item.url, score);
        return score;
      };
      return [...postsWithAmount].sort(
        (a, b) => getTrendingScore(b) - getTrendingScore(a),
      );
    }

    if (selectTime === 'new')
      return [...postsWithAmount].sort((a, b) => {
        return b.createdAt - a.createdAt;
      });

    return postsWithAmount;
  }, [
    selectType,
    selectTime,
    posts,
    friends,
    friends.length,
    posts.length,
    comments,
  ]);

  const onPressPost = useCallback(
    (channelUrl: string, isNowOpenKeyboard: boolean = false) => {
      navigation.navigate(PATHS_HOME_TAB.homeTabPost, {
        channelUrl,
        isNowOpenKeyboard,
      });
    },
    [navigation],
  );

  const onPressTaraStoryPost = useCallback(() => {
    navigation.navigate(PATHS_HOME_TAB.homeTabTaraDetails);
  }, [navigation]);

  async function handleIntercom() {
    if (SUPABASE_ENABLED) {
      // Support runs on OUR chat now (no Intercom). Instead of dropping the
      // user straight into a blank DM, take them through a short guided ticket
      // form (category → subject → description); on submit it logs the ticket
      // AND posts a formatted summary into the support DM, then lands them in
      // that chat. Messages list stays UNDER it, so back returns to the list.
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Messages',
          state: {
            routes: [
              { name: 'messages-tab-main' },
              { name: 'messages-tab-support-ticket' },
            ],
            index: 1,
          },
        }),
      );
      return;
    }
    openIntercom();
  }

  useEffect(() => {
    if (userChat?.userId && isFocused && !loadingStorage && !loadingServer) {
      feedEndReachedRef.current = false; // fresh load — pagination re-enabled
      getPosts();
      checkGeoLocationCity();
    }
  }, [isFocused, userChat?.userId]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (showResultPage) return;
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offsetY;
  };

  // --- infinite scroll (supabase mode): keyset pagination on created_at ----
  const paginatingRef = useRef(false);
  const feedEndReachedRef = useRef(false);
  const prevPostsLenRef = useRef(0);

  const handleEndReached = () => {
    if (!SUPABASE_ENABLED || showResultPage || loadingServer) return;
    if (paginatingRef.current || feedEndReachedRef.current) return;
    if (posts.length < 50) return; // less than one full page — nothing older
    paginatingRef.current = true;
    prevPostsLenRef.current = posts.length;
    const oldestMs = posts.reduce(
      (min, p: any) => Math.min(min, p.createdAt || min),
      Number.MAX_SAFE_INTEGER,
    );
    getPosts(new Date(oldestMs).toISOString());
  };

  useEffect(() => {
    if (!paginatingRef.current || loadingServer) return;
    paginatingRef.current = false;
    // Page came back empty -> we've reached the beginning of the feed.
    if (posts.length === prevPostsLenRef.current)
      feedEndReachedRef.current = true;
  }, [posts.length, loadingServer]);

  useEffect(() => {
    const rawKeyword = debouncedSearch.trim();
    const keyword = rawKeyword.toLowerCase();

    if (!keyword) {
      setShowResultPage(false);
      setSearchPosts([]);
      return;
    }

    // Instant local match over the already-loaded feed (creator name OR body).
    const enrich = (post: any) => {
      const amountMessage = comments[post.url]?.length || 0;
      const amountReaction =
        comments[post.url]?.length > 0
          ? comments[post.url][0].reactions?.find(
              reaction => reaction.key === 'smile',
            )?.sampledUserIds?.length || 0
          : 0;
      return {
        ...post,
        url: post.url,
        amountMessage,
        amountReaction,
        createdAt: post.createdAt,
      };
    };

    // Apply the active Trending/New sort to a result set.
    const sortResults = (list: GroupChannelSendBirdType[]) => {
      if (selectTime === 'trending') {
        const cache = new Map<string, number>();
        const score = (item: GroupChannelSendBirdType) => {
          const cached = cache.get(item.url);
          if (cached !== undefined) return cached;
          let commentQty = 0;
          try {
            commentQty = JSON.parse(item.data).commentQty || 0;
          } catch {
            commentQty = 0;
          }
          const s = commentQty + commentQty;
          cache.set(item.url, s);
          return s;
        };
        return [...list].sort((a, b) => score(b) - score(a));
      }
      if (selectTime === 'new') {
        return [...list].sort((a, b) => b.createdAt - a.createdAt);
      }
      return list;
    };

    let cancelled = false;
    const localFiltered = posts
      .filter(post => {
        let parsedData: any = {};
        try {
          parsedData = JSON.parse(post.data || '{}');
        } catch (e) {
          // ignore parsing errors
        }
        const creatorName = post.creator?.nickname?.toLowerCase() || '';
        const firstMessage = parsedData.firstMessage?.toLowerCase() || '';
        return creatorName.includes(keyword) || firstMessage.includes(keyword);
      })
      .map(enrich) as GroupChannelSendBirdType[];

    setShowResultPage(true);

    // Backend V2: full-text search across ALL posts the user can see (not just
    // the paginated window). Server results replace the local ones when they
    // arrive; the local pass keeps the UI instant and covers author-name hits.
    // A leading '#' means "show me this exact tag" -> hashtag RPC (indexed,
    // exact match) instead of full-text search. Tapping a #tag anywhere in the
    // app deep-links here with `#tag` prefilled.
    const isHashtag = rawKeyword.startsWith('#') && rawKeyword.length > 1;

    if (SUPABASE_ENABLED) {
      (async () => {
        try {
          const remote = (
            isHashtag
              ? await getPostsByHashtag(rawKeyword.slice(1))
              : await searchPostsRemote(rawKeyword)
          ).map(enrich) as GroupChannelSendBirdType[];
          if (cancelled) return;
          // Merge: server FTS body hits + local author-name hits, de-duped.
          const byUrl = new Map<string, GroupChannelSendBirdType>();
          [...remote, ...localFiltered].forEach(p => {
            if (!byUrl.has(p.url)) byUrl.set(p.url, p);
          });
          const merged = [...byUrl.values()];
          setSearchPosts(sortResults(merged));
        } catch (error) {
          if (__DEV__) console.warn('searchPostsRemote failed', error);
          if (!cancelled) setSearchPosts(sortResults(localFiltered));
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    // Mock/legacy mode: local results only.
    setSearchPosts(sortResults(localFiltered));
  }, [debouncedSearch, posts, selectTime, comments]);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      if (showResultPage) {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        listRef.current?.scrollToOffset({
          offset: scrollOffsetRef.current,
          animated: false,
        });
      }
    });

    return () => task.cancel();
  }, [showResultPage]);

  const renderPostItem = useCallback(
    ({ item }: { item: any }) => (
      <PostHomeTab
        post={item}
        onPressPost={onPressPost}
        isSearchMode={showResultPage}
      />
    ),
    [onPressPost, showResultPage],
  );

  const keyExtractor = useCallback(
    // Supabase posts carry `url` (legacy Sendbird carried `channelUrl`);
    // reading only channelUrl made every key fall back to the index, which
    // recycles the wrong rows when Trending/New re-sorts the list.
    (item: any, index: number) =>
      item.url ?? item.channelUrl ?? `post-${index}`,
    [],
  );

  return (
    <BackgroundScreen type="home-main">
      <View
        style={styles.container}
        onStartShouldSetResponder={() => {
          Keyboard.dismiss();
          // false: do not become the responder, so this never swallows a tap
          // meant for a button or the list underneath.
          return false;
        }}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Community Wall</Text>
          <NotificationButtonHomeTab navigation={navigation} />
        </View>

        <InputSearch
          search={search}
          setSearch={setSearch}
          placeholder="Search Community"
          styleContainer={styles.inputSearchContainer}
          styleInput={styles.inputSearch}
          iconProps={{ width: 20, height: 20, strokeWidth: 2.1 }}
          placeholderTextColor={colors.neutral[600]}
          onClear={() => setSearch('')}
        />
        {!showResultPage && (
          <ThreeButtonsHomeTab
            selectType={selectType}
            setSelectType={setSelectType}
          />
        )}
        <View style={styles.screen}>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={() =>
                setSelectTime(selectTime === 'trending' ? null : 'trending')
              }
              style={[
                styles.button,
                selectTime === 'trending' && styles.buttonSelected,
              ]}
            >
              <IconTabHeart
                width={14}
                height={14}
                stroke={
                  selectTime === 'trending' ? colors.white : colors.muted
                }
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.buttonText,
                  selectTime === 'trending' && styles.buttonTextSelected,
                ]}
              >
                Trending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectTime(selectTime === 'new' ? null : 'new')}
              style={[
                styles.button,
                selectTime === 'new' && styles.buttonSelected,
              ]}
            >
              <IconClock
                width={14}
                height={14}
                stroke={
                  selectTime === 'new' ? colors.white : colors.muted
                }
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.buttonText,
                  selectTime === 'new' && styles.buttonTextSelected,
                ]}
              >
                New
              </Text>
            </TouchableOpacity>
          </View>

          {loadingServer ? (
            <LoadingLine />
          ) : (
            <View style={styles.loadingLine} />
          )}

          <FlatList
            ref={listRef}
            data={showResultPage ? searchPosts : showPosts}
            keyExtractor={keyExtractor}
            renderItem={renderPostItem}
            ListHeaderComponent={
              showResultPage ? null : (
                <TaraStoryPostHomeTab
                  onPressTaraStoryPost={onPressTaraStoryPost}
                />
              )
            }
            ListEmptyComponent={
              !loadingStorage ? (
                <View style={styles.notListContainer}>
                  <IconMessagesNotGroup width={84} height={84} />
                  <View style={styles.notListTextContainer}>
                    <Text style={styles.notListText}>
                      {showResultPage ? 'No Results' : 'It’s quiet here'}
                    </Text>
                    {showResultPage ? (
                      <>
                        <Text style={styles.notListSubText}>
                          We couldn’t find anything.
                        </Text>
                        <Text style={styles.notListSubText}>
                          Try a different search.
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.notListSubText}>
                        {posts.length === 0
                          ? 'Start posting and sharing your journey'
                          : 'No posts found'}
                      </Text>
                    )}
                  </View>
                </View>
              ) : null
            }
            contentContainerStyle={styles.contentContainer}
            ListFooterComponent={
              loadingStorage ? (
                <ActivityIndicator color={colors.magentaText} />
              ) : null
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            // Tapping the feed while the search keyboard is up now dismisses
            // it: "handled" lets a tap on a post still open that post, but a
            // tap on empty space closes the keyboard instead of doing nothing.
            keyboardShouldPersistTaps="handled"
            // Scrolling away from the search field dismisses it too, which is
            // what people reach for before they think to tap.
            keyboardDismissMode="on-drag"
          />
        </View>
        {/* The floating support-chat button used to sit above the plus. It
            duplicated a destination the bottom bar already owns, and stacking
            two circles in the same corner made the primary action, posting,
            compete with a secondary one. Support is reachable from Messages. */}
        <TouchableOpacity
          onPress={() => navigation.navigate(PATHS_HOME_TAB.homeTabCreatePost)}
          style={styles.buttonAdd}
        >
          <IconPlus
            width={34}
            height={34}
            stroke={colors.white}
            strokeWidth={1.8}
          />
        </TouchableOpacity>
      </View>
    </BackgroundScreen>
  );
};

export default HomeTabMain;
