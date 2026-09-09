import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { ConnectStackParamList } from 'types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// types
import { User } from '../Map/map.screen';

// providers
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// hooks
import { getFileStorageAmplify } from 'utils/amplify-storage';
import useFriendsUserDB from 'providers/UserDBProvider/useFriendsUserDB';

// icons
import {
  IconArrowLeft,
  IconChatBubbleLeft,
  IconMapPin,
  IconMiddleDot,
  IconUserMinus,
  IconUserPlus,
} from 'assets/icons-auto/components';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { findOrCreateDirectConversation } from 'services/supabase/supabase.chat';
import {
  getPostsByUser,
  getMemberJoinedAt,
} from 'services/supabase/supabase.social';
import { publicUrlFor } from 'services/supabase/supabase.storage';

// hooks
import { useCountry } from 'presentation/hooks';
import { toLocalizedDateString } from 'utils/formatDate';

// styles
import colors from 'styles/colors';
import styles from './details.styles';

type DetailsScreenProps = {
  navigation: NativeStackNavigationProp<ConnectStackParamList>;
};

const DetailsScreen: FunctionComponent<DetailsScreenProps> = ({
  navigation: navigationProps,
}) => {
  const navigation = useNavigation();
  const { getChannels } = useChatProvider();
  const { showToast } = useToastProvider();
  const route =
    useRoute<
      RouteProp<{ params: { user: User; fromExternal?: boolean } }, 'params'>
    >();
  const {
    isCurrentUser,
    isPending,
    isAccepted,
    isLoading,
    isFriend: isFriendSendbird,
    handleFriend,
  } = useFriendsUserDB({
    friendId: route.params?.user.id || '',
    friendCognitoId: route.params?.user.cognitoId || '',
    navigation: navigationProps,
  });

  const { allCountries } = useCountry();

  const [profilePicture, setProfilePicture] = useState<URL | undefined>();
  const [isLoadingSendMessage, setIsLoadingSendMessage] = useState(false);
  const [memberPosts, setMemberPosts] = useState<any[]>([]);
  const [joinedAt, setJoinedAt] = useState<string | null>(null);

  const { user } = useMemo(() => route.params, [route.params]);

  const country = useMemo(
    () =>
      allCountries.find(country => country.code === user.country)?.name ||
      'Unknown Country',
    [user.country],
  );

  async function getProfilePicture() {
    if (SUPABASE_ENABLED) {
      // Supabase avatars: public-bucket url — no Amplify signed-url call.
      const publicUrl = publicUrlFor('avatars', user.profilePicture);
      setProfilePicture(publicUrl ? new URL(publicUrl) : undefined);
      return;
    }
    const profilePicture = await getFileStorageAmplify(user.profilePicture);
    setProfilePicture(profilePicture);
  }

  function toChatUser(channelUrl: string, userId: string) {
    navigationProps.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Messages',
            state: {
              routes: [
                {
                  name: PATHS_MESSAGES_TAB.messagesTabMain,
                },
                {
                  name: PATHS_MESSAGES_TAB.messagesTabChat,
                  params: {
                    channelUrl,
                    userId,
                  },
                },
              ],
            },
          },
        ],
      }),
    );
  }

  async function handleMessage() {
    if (SUPABASE_ENABLED) {
      // Supabase mode: 1:1 chat lives in the conversations tables. The
      // conversation id plays the role of channel.url; user ids ARE profile
      // ids in this mode.
      try {
        setIsLoadingSendMessage(true);
        const conversationId = await findOrCreateDirectConversation(user.id);
        await getChannels();
        return toChatUser(conversationId, user.id);
      } catch (error) {
        if (__DEV__) console.warn('Error opening conversation:', error);
        showToast({
          type: 'info',
          message: 'Unable to open chat right now',
        });
        return null;
      } finally {
        setIsLoadingSendMessage(false);
      }
    }
  }

  function handleMap() {
    if (
      !user ||
      !user.geoLocation ||
      !user.geoLocation.latitude ||
      !user.geoLocation.longitude
    )
      return showToast({
        type: 'error',
        message: 'This member has not shared a location.',
      });

    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'Connect',
          state: {
            routes: [
              {
                name: 'MapView',
                params: {
                  user: user,
                },
              },
            ],
          },
        },
      ],
    });
  }

  const gender =
    user?.gender === 'prefer-not-to-say'
      ? ''
      : user.gender.charAt(0).toUpperCase() + user.gender.slice(1);

  const imageSource = profilePicture
    ? { uri: profilePicture.toString() }
    : require('../../../../assets/images/image-not-found.png');

  useEffect(() => {
    getProfilePicture();
  }, [user?.profilePicture]);

  // Backend V2: member "joined" date + their posts (getPostsByUser). RLS means
  // only posts this viewer is allowed to see come back. Additive, best-effort.
  useEffect(() => {
    if (!SUPABASE_ENABLED || !user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const [joined, posts] = await Promise.all([
          getMemberJoinedAt(user.id),
          getPostsByUser(user.id, 20),
        ]);
        if (cancelled) return;
        setJoinedAt(joined);
        setMemberPosts(posts ?? []);
      } catch (error) {
        if (__DEV__) console.warn('Error loading member profile posts', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const joinedLabel = useMemo(() => {
    if (!joinedAt) return null;
    return toLocalizedDateString(
      new Date(joinedAt).getTime(),
      user?.country ?? '',
      { month: 'long', year: 'numeric' },
    );
  }, [joinedAt, user?.country]);

  const handleBack = () => {
    if (route.params?.fromExternal) {
      navigation.getParent()?.goBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <LinearGradient
      colors={[colors.ground, colors.surface, colors.deepwater]}
      locations={[0, 0.4, 1]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <View style={styles.backButton}>
              <TouchableOpacity onPress={handleBack}>
                <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
              </TouchableOpacity>

              <View style={styles.profileContainer}>
                <View style={styles.profileDetails}>
                  <Image source={imageSource} style={styles.profileImage} />
                  <Text style={styles.profileName}>{user.firstName}</Text>
                </View>
                <View style={styles.profileInfoRow}>
                  <Text style={styles.profileInfoText}>{gender}</Text>
                  {gender && (
                    <IconMiddleDot
                      width={8}
                      height={8}
                      fill={colors.neutral[700]}
                    />
                  )}
                  <Text style={styles.profileInfoText}>
                    {user.city}, {country}
                  </Text>
                  <IconMiddleDot
                    width={8}
                    height={8}
                    fill={colors.neutral[700]}
                  />
                  <Text style={styles.profileInfoDate}>{user.age}</Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 16 }}>
              <TouchableOpacity
                onPress={handleFriend}
                disabled={isPending || isCurrentUser || isLoading}
                style={[
                  styles.buttonFriend,
                  {
                    backgroundColor:
                      isPending || isCurrentUser
                        ? colors.primary[300]
                        : isAccepted || isFriendSendbird
                        ? colors.neutral[400]
                        : colors.primary[500],
                  },
                ]}
              >
                {isAccepted || isFriendSendbird ? (
                  <IconUserMinus
                    width={16}
                    height={16}
                    stroke={colors.muted}
                  />
                ) : (
                  <IconUserPlus
                    width={16}
                    height={16}
                    stroke={colors.neutral[100]}
                  />
                )}

                <Text
                  style={[
                    {
                      color:
                        (isAccepted || isFriendSendbird) && !isLoading
                          ? colors.neutral[900]
                          : colors.neutral[100],
                    },
                    styles.textFriend,
                  ]}
                >
                  {isLoading
                    ? 'Loading...'
                    : isPending
                    ? 'Requested'
                    : isAccepted || isFriendSendbird
                    ? 'Remove friend'
                    : 'Add Friend'}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionButtonRow}>
                <TouchableOpacity
                  disabled={isLoadingSendMessage}
                  onPress={handleMessage}
                  style={styles.actionButtonMessage}
                >
                  <Text style={styles.buttonText}>
                    {isLoadingSendMessage ? 'Connecting...' : 'Send message'}
                  </Text>
                  <IconChatBubbleLeft
                    width={19}
                    height={19}
                    stroke={colors.heading}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleMap}
                  style={styles.actionButtonMap}
                >
                  <Text style={styles.buttonText}>View in map</Text>
                  <IconMapPin
                    width={19}
                    height={19}
                    stroke={colors.heading}
                    fill="transparent"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.detailsCard}>
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Diagnosis Type</Text>
                  <Text numberOfLines={1} style={styles.detailsValue}>
                    {user.diagnosisTypes[0]?.description}
                  </Text>
                </View>

                {user.diagnosisSubTypes[0]?.description && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Diagnosis Sub Type</Text>
                    <Text numberOfLines={1} style={styles.detailsValue}>
                      {user.diagnosisSubTypes[0]?.description}
                    </Text>
                  </View>
                )}

                {user.diagnosisYear && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Diagnosis Date</Text>
                    <Text numberOfLines={1} style={styles.detailsDate}>
                      {user.diagnosisYear || ''}
                    </Text>
                  </View>
                )}

                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Role</Text>
                  <Text numberOfLines={1} style={styles.detailsValue}>
                    {user.role?.description}
                  </Text>
                </View>

                {joinedLabel && (
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Member since</Text>
                    <Text numberOfLines={1} style={styles.detailsDate}>
                      {joinedLabel}
                    </Text>
                  </View>
                )}
              </View>

              {SUPABASE_ENABLED && memberPosts.length > 0 && (
                <View style={styles.detailsCard}>
                  <Text style={[styles.detailsLabel, { marginBottom: 8 }]}>
                    Posts
                  </Text>
                  {memberPosts.map(post => {
                    let body = '';
                    try {
                      body = JSON.parse(post.data || '{}').firstMessage ?? '';
                    } catch {
                      body = '';
                    }
                    return (
                      <View
                        key={post.url}
                        style={{
                          paddingVertical: 8,
                          borderTopWidth: 1,
                          borderTopColor: colors.line,
                        }}
                      >
                        <Text
                          numberOfLines={3}
                          style={[styles.detailsValue, { textAlign: 'left' }]}
                        >
                          {body}
                        </Text>
                        <Text style={styles.profileInfoDate}>
                          {toLocalizedDateString(
                            post.createdAt,
                            user?.country ?? '',
                            { day: 'numeric', month: 'numeric', year: 'numeric' },
                          )}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default DetailsScreen;
