import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import colors from 'styles/colors';
import styles from './PostHomeTab.styles';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { useGetUsersReq } from 'presentation/services/react-query/user.query';
import { usePostsProvider } from 'providers/PostsProvider/PostsProvider';
import AvatarMessagesTab from 'main/screens/MessagesTab/components/AvatarMessagesTab/AvatarMessagesTab';
import { GroupChannelSendBirdType } from 'providers/ChatProvider/ChatProvider.types';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { toLocalizedDateString } from 'utils/formatDate';

import { IconArrowRight } from 'assets/icons-auto/components';
import PostReadMoreButton from '../PostReadMoreButton/PostReadMoreButton';
import PostFooter from '../PostFooter/PostFooter';
import RichText from 'components/RichText/RichText';
import { PostImageWithLoading } from '../PostImageWithLoading/PostImageWithLoading';
import { getOriginalImageUrl } from 'utils/imageUrlUtils';

// backend v2
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { toggleReactionOn } from 'services/supabase/supabase.social';

type PostHomeTabProps = {
  post: GroupChannelSendBirdType;
  onPressPost: (channelUrl: string, isNowOpenKeyboard?: boolean) => void;
  isSearchMode?: boolean;
};

const PostHomeTab: FunctionComponent<PostHomeTabProps> = ({
  post,
  onPressPost,
  isSearchMode = false,
}) => {
  const { userDB, getOnlyUserDBById } = useUserDBProvider();
  const navigation = useNavigation();
  const { showToast } = useToastProvider();
  const { data: usersData } = useGetUsersReq();
  const { sendNotification, comments: comment } = usePostsProvider();

  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Identity from the REAL profile (likes arrays store profile ids).
  // sdk.currentUser is the dead Sendbird shim proxy — truthy but never a
  // matching id, which made hearts never render as "liked".
  const userID = useMemo(
    () => userDB?.id ?? userDB?.cognitoId ?? '',
    [userDB?.id, userDB?.cognitoId],
  );

  // Parse post.data once per data change instead of on every focus/render
  const postData = useMemo(() => {
    try {
      return JSON.parse(post.data || '{}');
    } catch (error) {
      return {};
    }
  }, [post.data]);

  const message = postData.firstMessage;
  const comments = postData.commentQty || 0;
  const postImage: string = postData.image_sm ?? '';
  // Group attribution: "in <Group Name>" for group-targeted posts, or the
  // audience tags for community (My Groups) posts.
  const groupLabel = useMemo(() => {
    if (postData.visibility !== 'group') return null;
    if (postData.groupName) return `in ${postData.groupName}`;
    const tags: string[] = postData.audienceTags ?? [];
    if (tags.length > 0)
      return `in ${tags
        .map((t: string) => t.replace(/\b\w/g, (c: string) => c.toUpperCase()))
        .join(' \u00b7 ')}`;
    return 'in My Groups';
  }, [postData]);

  useEffect(() => {
    // Counts + own-like flag (the feed no longer ships the full liker array).
    // Fall back to the legacy array shape if present (mock mode).
    const legacy = postData.likes;
    setLikes(
      postData.likeCount ?? (Array.isArray(legacy) ? legacy.length : 0),
    );
    setIsLiked(
      postData.likedByMe ??
        (Array.isArray(legacy) ? legacy.includes(userID || '') : false),
    );
  }, [postData, userID]);

  const goToUserProfile = async () => {
    const authorId = post.creator?.userId;
    // The loaded list is a capped page (500 profiles, no ordering), not the
    // membership. With a community larger than that, most authors are simply
    // absent from it — and "not in the page I happen to hold" was being
    // reported to the member as "this account may have been deleted", about
    // people who are very much there. Try the list first because it costs
    // nothing, then ask the server for the one profile.
    let author =
      usersData?.data?.find(userById => userById.cognitoId === authorId) ??
      null;

    if (!author && authorId) {
      try {
        author = (await getOnlyUserDBById(
          authorId,
        )) as unknown as typeof author;
      } catch (error) {
        if (__DEV__) console.warn('Error loading post author', error);
      }
    }

    if (!author) {
      showToast({
        type: 'error',
        message: 'That profile could not be opened. Please try again.',
      });
      return;
    }

    const userFilter = [author];

    // A copy, and an empty string rather than a bundled image. This used to
    // assign the required PNG straight onto the shared object: require()
    // returns a Metro asset NUMBER, and profilePicture is a storage path, so
    // publicUrlFor() later called .startsWith on a number and threw. It also
    // mutated a row owned by the query cache, so the bad value followed that
    // member into the list, the map and their profile. Both screens already
    // fall back to a placeholder when there is no picture.
    const userCatch = { ...userFilter[0] };
    if (!post.creator?.plainProfileUrl) {
      userCatch.profilePicture = '';
    }

    navigation.navigate('Connect', {
      screen: 'DetailView',
      params: {
        user: userCatch,
        fromExternal: true,
      },
    });
    return;
  };

  const handlePressPost = useCallback(() => {
    onPressPost(post.url);
  }, [onPressPost, post.url]);

  const handlePressComment = useCallback(() => {
    // Open the post detail with the comment composer focused — same params
    // the "Read More" path uses. The legacy build only synced Sendbird
    // channel metadata here (no navigation); that sync is gone with Sendbird.
    onPressPost(post.url, true);
  }, [comment, post.url, onPressPost]);

  const toggleReactionUserMessage = useCallback(async () => {
    if (SUPABASE_ENABLED) {
      // No Sendbird here: identity is the Supabase profile id only.
      if (!post?.url) return;
      const myId = userDB?.cognitoId || userDB?.id || '';
      if (!myId) {
        if (__DEV__) console.warn('Like ignored: profile not loaded yet');
        return;
      }

      // Optimistic flip so the heart responds instantly.
      const wasLiked = isLiked;
      const prevLikes = likes;
      setIsLiked(!wasLiked);
      setLikes(wasLiked ? Math.max(prevLikes - 1, 0) : prevLikes + 1);

      try {
        const { count, likedByMe } = await toggleReactionOn('post', post.url);
        // Reconcile with server truth.
        const nowLiked = likedByMe;
        setLikes(count);
        setIsLiked(nowLiked);

        const notifierId = post.creator?.userId;
        if (nowLiked && notifierId && notifierId !== myId) {
          sendNotification({
            notifierId,
            senderId: myId,
            entityType: 'NEW_LIKE',
            type: 'post',
            content: message,
            meta: {
              id: post.url,
              redirectUrl: `sendbird/${post.url}`,
            },
          });
        }
      } catch (error) {
        // Revert the optimistic flip on failure.
        setIsLiked(wasLiked);
        setLikes(prevLikes);
        if (__DEV__) console.warn('Error toggling reaction:', error);
      }
      return;
    }
  }, [
    post,
    userID,
    message,
    sendNotification,
    userDB?.cognitoId,
    userDB?.id,
    isLiked,
    likes,
  ]);

  // useEffect(() => {
  //   setMetadata(sdk, comment, post.url);
  // }, []);
  if (isSearchMode) {
    return (
      <View style={[styles.searchTitleContainer]}>
        <Text style={styles.searchHeaderText} numberOfLines={1}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={handlePressPost}
          style={styles.searchReadMoreButton}
        >
          <Text style={styles.searchReadMoreText}>Read full story</Text>
          <IconArrowRight
            width={19}
            height={19}
            stroke={colors.heading}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </View>
    );
  }

  if (postImage && postImage.length > 0)
    return (
      <View style={styles.withImageContainer}>
        <TouchableOpacity onPress={handlePressPost}>
          <PostImageWithLoading
            key={postImage}
            uri={postImage}
            backupUri={getOriginalImageUrl(postImage)}
            style={styles.image}
            resizeMode="cover"
            containerStyle={styles.imageContainer}
          />
        </TouchableOpacity>
        <View style={styles.withImageContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.withImageHeaderText} numberOfLines={1}>
              {message}
              {groupLabel ? (
                <Text style={styles.headerTime}> {groupLabel}</Text>
              ) : null}
            </Text>
            <PostReadMoreButton onPress={handlePressPost} text="Read More" />
          </View>
          {/* Highlight #tags/@mentions but keep the whole card tappable:
              no press handlers here, so taps fall through to the card. */}
          <RichText
            text={message ?? ''}
            style={[styles.contentText, { paddingRight: 12 }]}
            numberOfLines={2}
          />
        </View>
        <PostFooter
          footerStyles={styles.withImageFooter}
          likes={likes}
          isLiked={isLiked}
          onPressLike={toggleReactionUserMessage}
          comments={comments}
          onPressComment={handlePressComment}
        />
      </View>
    );

  return (
    <View style={styles.mainContainer}>
      <TouchableOpacity onPress={handlePressPost}>
        <LinearGradient
          // Deepwater to surface: an on-brand green that reads as depth on the
          // card rather than the grey the old tints became on a dark ground.
          colors={[colors.deepwater, colors.surface]}
          start={[0, 0]}
          end={[1, 1]}
          style={styles.container}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.headerLeft,
                { flexDirection: 'row', alignItems: 'center', flex: 1 },
              ]}
            >
              <TouchableOpacity onPress={goToUserProfile}>
                <AvatarMessagesTab
                  imageUrl={post.creator?.plainProfileUrl || ''}
                  width={35}
                  height={35}
                  name={post.creator?.nickname || ''}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goToUserProfile}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={[styles.headerText]} numberOfLines={1}>
                  {post.creator?.nickname || ''}
                  {groupLabel ? (
                    <Text style={styles.headerTime}> {groupLabel}</Text>
                  ) : null}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTime}>
              {toLocalizedDateString(post.createdAt, userDB?.country ?? '', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.content}>
            {/* Highlight-only (no handlers) so the card press wins the tap. */}
            <RichText
              text={message ?? ''}
              style={styles.contentText}
              numberOfLines={4}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <PostFooter
        likes={likes}
        isLiked={isLiked}
        onPressLike={toggleReactionUserMessage}
        comments={comments}
        onPressComment={handlePressComment}
      />
    </View>
  );
};

export default React.memo(PostHomeTab);
