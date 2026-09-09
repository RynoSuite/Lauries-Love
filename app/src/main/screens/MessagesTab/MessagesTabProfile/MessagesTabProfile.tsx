import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { CommonActions, RouteProp, useRoute } from '@react-navigation/native';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator } from 'react-native-paper';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';
import { UserSendBirdType } from 'providers/ChatProvider/ChatProvider.types';
import { UserDBType } from 'providers/UserDBProvider/UserDBProvider.types';

// providers
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';

// hooks
import useFriendsUserDB from 'providers/UserDBProvider/useFriendsUserDB';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import Button from 'components/Button/Button';
import AvatarProfile from 'main/screens/ProfileTab/components/AvatarProfile/AvatarProfile';
import AvatarMessagesTab from '../components/AvatarMessagesTab/AvatarMessagesTab';

// icons
import {
  IconArrowLeft,
  IconChatBubbleLeft,
  IconMapPin,
  IconUserMinus,
  IconUserPlus,
} from 'assets/icons-auto/components';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';
import { DEFAULT_ERROR_NOT_FOUND_USER_SENDBIRD } from 'providers/ChatProvider/ChatProvider.constants';

// supabase (Backend V2) chat
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { findOrCreateDirectConversation } from 'services/supabase/supabase.chat';
import { publicUrlFor } from 'services/supabase/supabase.storage';

// hooks
import { useCountry } from 'presentation/hooks';

// styles
import styles from './MessagesTabProfile.styles';
import colors from 'styles/colors';
import { ScrollView } from 'react-native-gesture-handler';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

type MessagesTabProfileProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabProfile: FunctionComponent<MessagesTabProfileProps> = ({
  navigation,
}) => {
  const { showToast } = useToastProvider();
  const { getChannels } = useChatProvider();
  const { getOnlyUserDBById } = useUserDBProvider();
  const route =
    useRoute<RouteProp<RootMessagesTabParamList, 'messages-tab-profile'>>();
  const {
    isLoading: isLoadingFriends,
    isCurrentUser,
    isFriend: isFriendSendbird,
    isAccepted: isFriend,
    isPending,
    handleFriend,
  } = useFriendsUserDB({
    friendId: route.params?.userId || '',
    friendCognitoId: route.params?.cognitoId || '',
    navigation,
  });
  const { allCountries } = useCountry();

  const [selectUserSendbird, setSelectUserSendbird] =
    useState<UserSendBirdType | null>(null);
  const [selectUserDB, setSelectUserDB] = useState<UserDBType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showName = useMemo(() => {
    if (selectUserSendbird?.nickname) return selectUserSendbird?.nickname;
    if (selectUserDB?.firstName)
      return `${selectUserDB?.firstName}${
        selectUserDB?.lastName ? ` ${selectUserDB?.lastName}` : ''
      }`;
    return '';
  }, [
    selectUserSendbird?.nickname,
    selectUserDB?.firstName,
    selectUserDB?.lastName,
  ]);

  const allInfo = useMemo(() => {
    if (!selectUserSendbird && !selectUserDB) return null;
    if (!selectUserDB?.gender) return null;

    const gender =
      selectUserDB?.gender === 'prefer-not-to-say'
        ? ''
        : selectUserDB?.gender.charAt(0).toUpperCase() ||
          selectUserDB?.gender + selectUserDB?.gender.slice(1);
    const selectCity =
      selectUserSendbird?.metaData.city || selectUserDB?.state || null;
    const selectCountryCode =
      selectUserSendbird?.metaData.country || selectUserDB?.country || null;
    const selectCountry =
      allCountries.find(country => country.code === selectCountryCode)?.name ||
      'Unknown Country';
    const selectAge =
      selectUserSendbird?.metaData.age || selectUserDB?.age || null;
    const city = selectCity
      ? `${selectCity.slice(0, 1).toUpperCase()}${selectCity.slice(1)}`
      : null;
    const place =
      city || selectCountry
        ? `${city ? ` ${city}${selectCountry ? ', ' : ''}` : ''}${
            selectCountry ? `${selectCountry}` : ''
          }`
        : null;
    const age = selectAge;
    return `${gender && `${gender} • `}${place ? `${place}` : ''}${
      age ? ` • ${age}` : ''
    }`;
  }, [selectUserSendbird, selectUserDB]);

  const getUserDB = async (id: string) => {
    try {
      const userDB = await getOnlyUserDBById(id);
      return userDB;
    } catch (error) {
      if (__DEV__) console.warn('getUser error', error);
      return null;
    }
  };

  const getUserSendbird = async () => {
    if (SUPABASE_ENABLED) {
      // Sendbird is gone: build the "chat user" straight from the profile.
      // route userId/cognitoId are both the Supabase profile id.
      try {
        const profileId = route.params?.userId || route.params?.cognitoId || '';
        const userDB = profileId ? await getUserDB(profileId) : null;
        if (!userDB) {
          Alert.alert('Error', DEFAULT_ERROR_NOT_FOUND_USER_SENDBIRD, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        setSelectUserSendbird({
          userId: userDB.id,
          nickname: userDB.displayName || userDB.firstName || 'Member',
          plainProfileUrl: '',
          isActive: true,
          metaData: { id: userDB.id, cognitoId: userDB.cognitoId },
        } as unknown as UserSendBirdType);
        const profileImgUrl = userDB.profilePicture
          ? publicUrlFor('avatars', userDB.profilePicture)
          : null;
        setSelectUserDB({ ...userDB, profileImgUrl });
      } catch (error) {
        if (__DEV__) console.warn('getUser error', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }
  };

  const openChat = async () => {
    if (SUPABASE_ENABLED) {
      // Supabase mode: route userId IS the profile id; the conversation id
      // plays the role of channel.url.
      try {
        const otherProfileId = route.params?.userId || '';
        if (!otherProfileId) return;
        const conversationId = await findOrCreateDirectConversation(
          otherProfileId,
        );
        getChannels();
        return navigation.navigate(PATHS_MESSAGES_TAB.messagesTabChat, {
          channelUrl: conversationId,
          userId: otherProfileId,
        });
      } catch (error) {
        if (__DEV__) console.warn('openChat error', error);
      }
      return;
    }
  };

  const onViewMap = async () => {
    if (
      !selectUserDB ||
      !selectUserDB.geoLocation ||
      !selectUserDB.geoLocation.latitude ||
      !selectUserDB.geoLocation.longitude
    )
      return showToast({
        type: 'error',
        message: 'This member has not shared a location.',
      });

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'Connect',
            state: {
              routes: [
                {
                  name: 'MapView',
                  params: {
                    user: selectUserDB,
                  },
                },
              ],
            },
          },
        ],
      }),
    );
  };

  useEffect(() => {
    getUserSendbird();
  }, []);

  return (
    <BackgroundScreen type="messages-tab-profile">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.backButton}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.profileContainer}>
              <View style={styles.profileDetails}>
                {selectUserDB ? (
                  <AvatarProfile user={selectUserDB} width={120} height={120} />
                ) : selectUserSendbird?.plainProfileUrl ? (
                  <AvatarMessagesTab
                    imageUrl={selectUserSendbird.plainProfileUrl}
                    width={120}
                    height={120}
                  />
                ) : (
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatarLetterContainer}>
                      <Text style={styles.avatarLetter}>
                        {selectUserSendbird?.nickname[0] ||
                          selectUserSendbird?.userId[0]}
                      </Text>
                    </View>
                  </View>
                )}
                <Text style={styles.profileName}>{showName}</Text>
              </View>
              <Text style={styles.profileInfoText}>{allInfo}</Text>
            </View>
          </View>

          <View style={{ gap: 16 }}>
            {/* Same rule as the Connect profile: there is no friendship to add
                or remove with yourself, so the control is absent rather than
                permanently disabled. */}
            {!isCurrentUser && (
            <Button
              disabled={isPending || isLoadingFriends || isLoading}
              title={
                isLoadingFriends
                  ? 'Loading...'
                  : isFriend || isFriendSendbird
                  ? 'Remove Friend'
                  : isLoading || isPending
                  ? 'Requested'
                  : 'Add Friend'
              }
              shape="rounded"
              prefix={
                isFriend || isFriendSendbird ? (
                  <IconUserMinus width={16} height={16} />
                ) : (
                  <IconUserPlus
                    width={16}
                    height={16}
                    stroke={colors.neutral[100]}
                  />
                )
              }
              onPress={handleFriend}
              styleContainer={
                isFriend || isFriendSendbird
                  ? { backgroundColor: colors.line }
                  : isLoading || isPending
                  ? { backgroundColor: colors.surface2 }
                  : { backgroundColor: colors.heading }
              }
              styleTitle={
                isFriend || isFriendSendbird
                  ? { color: colors.heading }
                  : { color: colors.white }
              }
            />
            )}
            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={styles.actionButtonMessage}
                onPress={openChat}
              >
                <Text style={styles.buttonText}>Send message</Text>
                <IconChatBubbleLeft
                  width={19}
                  height={19}
                  stroke={colors.heading}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButtonMap}
                onPress={onViewMap}
              >
                <Text style={styles.buttonText}>View on map</Text>
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
                  {!selectUserDB?.diagnosisTypes?.[0]
                    ? 'Not Specified'
                    : typeof selectUserDB?.diagnosisTypes?.[0] === 'string'
                    ? selectUserDB?.diagnosisTypes?.[0]
                    : selectUserDB?.diagnosisTypes?.[0].description}
                </Text>
              </View>
              {selectUserDB?.diagnosisSubTypes?.[0] && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Diagnosis Sub Type</Text>
                  <Text numberOfLines={1} style={styles.detailsValue}>
                    {!selectUserDB?.diagnosisSubTypes?.[0]
                      ? 'Not Specified'
                      : typeof selectUserDB?.diagnosisSubTypes?.[0] === 'string'
                      ? selectUserDB?.diagnosisSubTypes?.[0]
                      : selectUserDB?.diagnosisSubTypes?.[0].description}
                  </Text>
                </View>
              )}
              {selectUserDB?.diagnosisYear && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Diagnosis Date</Text>
                  <Text style={styles.detailsValue}>
                    {selectUserDB?.diagnosisYear || ''}
                  </Text>
                </View>
              )}
              {selectUserDB?.role && (
                <View style={styles.detailsRow}>
                  <Text style={styles.detailsLabel}>Role</Text>
                  <Text numberOfLines={1} style={styles.detailsValue}>
                    {selectUserDB.role.description}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator color={colors.primary[100]} />
          </View>
        )}
      </ScrollView>
    </BackgroundScreen>
  );
};

export default MessagesTabProfile;
