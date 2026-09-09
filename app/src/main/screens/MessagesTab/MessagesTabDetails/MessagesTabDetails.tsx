import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';
import { UserDBType } from 'providers/UserDBProvider/UserDBProvider.types';
import { UserSendBirdType } from 'providers/ChatProvider/ChatProvider.types';

// providers
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';
import ButtonModalTabs from 'components/ButtonModalTabs/ButtonModalTabs';
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';
import Button from 'components/Button/Button';
import AvatarMessagesTab from '../components/AvatarMessagesTab/AvatarMessagesTab';

// utils
import { getFileStorageAmplify } from 'utils/amplify-storage';

// backend v2
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';

// icons
import {
  IconBellOff,
  IconClose,
  IconGallery,
  IconLockProfile,
  IconMinusCircle,
  IconTabUser,
} from 'assets/icons-auto/components';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';

// styles
import colors from 'styles/colors';
import styles from './MessagesTabDetails.styles';

type MessagesTabDetailsProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabDetails: FunctionComponent<MessagesTabDetailsProps> = ({
  navigation,
}) => {
  const { bottom } = useSafeAreaInsets();
  const {
    members,
    blockedUsers,
    addBlockedUser,
    removeBlockedUser,
    getMember,
    groupChannels,
    userChat,
  } = useChatProvider();
  const { getOnlyUserDBById } = useUserDBProvider();
  const route =
    useRoute<RouteProp<RootMessagesTabParamList, 'messages-tab-details'>>();
  const [isModalBlock, setIsModalBlock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectMember, setSelectMember] = useState<UserSendBirdType | null>(
    null,
  );
  const [selectUserDB, setSelectUserDB] = useState<UserDBType | null>(null);

  const isBlock = useMemo(
    () =>
      route.params?.cognitoId
        ? blockedUsers.find(user => user.userId === route.params?.cognitoId) ||
          selectMember?.isBlockedByMe
        : false,
    [blockedUsers, route.params?.cognitoId],
  );

  const allInfo = useMemo(() => {
    const selectUserSendbird = selectMember;
    if (!selectUserSendbird && !selectUserDB) return null;
    const selectGender =
      selectUserSendbird?.metaData?.gender || selectUserDB?.gender || null;
    const selectCity =
      selectUserSendbird?.metaData?.city || selectUserDB?.state || null;
    const selectState =
      selectUserSendbird?.metaData?.state || selectUserDB?.state || null;
    const selectAge =
      selectUserSendbird?.metaData?.age || selectUserDB?.age || null;
    const gender = selectGender
      ? `${selectGender.slice(0, 1).toUpperCase()}${selectGender.slice(1)}`
      : null;
    const city = selectCity
      ? `${selectCity.slice(0, 1).toUpperCase()}${selectCity.slice(1)}`
      : null;
    const state = selectState
      ? `${selectState.slice(0, 1).toUpperCase()}${selectState.slice(1)}`
      : null;
    const place =
      city || state
        ? `${city ? ` ${city}${state ? ', ' : ''}` : ''}${
            state ? `${state}` : ''
          }`
        : null;
    const age = selectAge;
    const parts = [gender, place, age ? `${age}` : null].filter(Boolean);
    return parts.length > 0 ? parts.join(' • ') : null;
  }, [selectMember, selectUserDB]);

  const handleBlockUser = async () => {
    if (!selectMember) return;
    setIsModalBlock(false);
    setIsLoading(true);
    try {
      if (isBlock) await removeBlockedUser(selectMember.userId);
      else await addBlockedUser(selectMember.userId);
    } catch (error) {
      if (__DEV__) console.warn('Error on block user', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDBState = async () => {
    // Profile fetch via the REST layer (works in Supabase mode: /users/<id>).
    const profileId = selectMember?.metaData?.id || selectMember?.userId;
    const userDB = profileId ? await getOnlyUserDBById(profileId) : null;
    if (!userDB) return;
    let profileImgUrl: string | null = null;
    if (userDB.profilePicture && !SUPABASE_ENABLED) {
      // Legacy avatars live in S3; never worth blocking the screen on.
      try {
        profileImgUrl =
          (await getFileStorageAmplify(userDB.profilePicture))?.href || null;
      } catch (error) {
        if (__DEV__) console.warn('Error resolving avatar url', error);
      }
    }
    setSelectUserDB({
      ...userDB,
      profileImgUrl,
    });
  };

  const getMemberState = async () => {
    const memberKey = route.params?.cognitoId || route.params?.userId || '';
    try {
      let memberState = memberKey ? members[memberKey] : undefined;
      if (!memberState && route.params?.userId)
        memberState = members[route.params.userId];

      // Supabase mode: the provider seeds members from channel data, but if
      // the map misses, resolve the other participant straight from this
      // conversation's members (metaData.id = profile id). No Sendbird calls.
      if (!memberState && route.params?.channelUrl) {
        const channel = groupChannels.find(
          c => c.url === route.params?.channelUrl,
        );
        const other = channel?.members?.find(
          m => m.userId !== userChat?.userId,
        );
        if (other) memberState = other as unknown as UserSendBirdType;
      }

      // Legacy fallback (getMember is a guarded no-op in Supabase/mock mode).
      if (!memberState && memberKey) {
        await getMember(memberKey);
        memberState = members[memberKey];
      }

      if (memberState) setSelectMember(memberState);
    } catch (error) {
      if (__DEV__) console.warn('Error on get member', error);
    }
  };

  useEffect(() => {
    getMemberState();
  }, [members, groupChannels, route.params?.cognitoId, route.params?.userId]);

  useEffect(() => {
    if (selectMember?.userId) getUserDBState();
  }, [selectMember?.userId]);

  // Never render a dead white screen: keep the header + back button alive
  // even while (or if) the member can't be resolved.
  if (!selectMember)
    return (
      <BackgroundScreen type="messagesDetails">
        <HeaderTabScreen
          title="Details"
          onPressLeft={() => navigation.goBack()}
        />
        <View style={[styles.container, { alignItems: 'center' }]}>
          <ActivityIndicator color={colors.heading} />
        </View>
      </BackgroundScreen>
    );
  return (
    <>
      <BackgroundScreen type={isBlock ? 'friendBlock' : 'messagesDetails'}>
        <HeaderTabScreen
          title="Details"
          onPressLeft={() => navigation.goBack()}
        />
        <View style={styles.container}>
          <View style={styles.userContainer}>
            {selectMember.plainProfileUrl ? (
              <AvatarMessagesTab
                imageUrl={selectMember.plainProfileUrl}
                width={120}
                height={120}
              />
            ) : (
              <View style={styles.avatarContainer}>
                <View style={styles.avatarLetterContainer}>
                  <Text style={styles.avatarLetter}>
                    {selectMember.nickname[0] || selectMember.userId[0]}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.infoContainer}>
              <Text style={styles.name}>
                {selectMember.nickname || selectMember.userId}
              </Text>
              <Text style={styles.birthday}>{allInfo}</Text>
            </View>
          </View>
          {isBlock ? (
            <View style={styles.blockedContainer}>
              <View>
                <Text style={styles.blockedText}>Blocked</Text>
                <Text style={styles.subTitleBlocked}>
                  You can unblock this user anytime
                </Text>
              </View>
              <Button
                title={isLoading ? 'Loading...' : 'Unblock'}
                onPress={handleBlockUser}
                styleContainer={styles.buttonUnblock}
              />
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              <ButtonModalTabs
                Icon={IconGallery}
                label={'Media and docs'}
                iconProps={{
                  stroke: colors.body,
                  strokeWidth: 2.1,
                }}
                onPress={() => {
                  navigation.navigate(
                    PATHS_MESSAGES_TAB.messagesTabMediaAndDocs,
                    {
                      channelUrl: route.params?.channelUrl || '',
                    },
                  );
                }}
              />
              <ButtonModalTabs
                Icon={IconTabUser}
                iconProps={{
                  stroke: colors.body,
                  strokeWidth: 2.5,
                }}
                label={'Profile'}
                onPress={() => {
                  navigation.navigate(PATHS_MESSAGES_TAB.messagesTabProfile, {
                    userId: selectMember.metaData?.id || selectMember.userId,
                    cognitoId:
                      selectMember.metaData?.cognitoId || selectMember.userId,
                  });
                }}
              />
              <ButtonModalTabs
                Icon={IconLockProfile}
                iconProps={{
                  stroke: colors.error[500],
                  strokeWidth: 2.5,
                }}
                label={'Block user'}
                onPress={() => {
                  setIsModalBlock(true);
                }}
                isRightArrow={false}
                tone="danger"
              />
            </View>
          )}
        </View>
      </BackgroundScreen>
      {isModalBlock && (
        <BottomSheetCustom
          handleIndicatorStyle={styles.handleIndicatorStyle}
          onClose={() => {
            setIsModalBlock(false);
          }}
          snapPoints={['10%']}
        >
          <View
            style={[
              styles.containerBottomSheet,
              {
                paddingBottom: bottom,
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.titleHeader}>
                Block {selectMember.nickname || selectMember.userId}?
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsModalBlock(false);
                }}
                style={styles.buttonHeader}
              >
                <IconClose
                  width={30}
                  height={30}
                  stroke={colors.muted}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.857}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.content}>
              <View style={styles.blockUserContainer}>
                <IconMinusCircle
                  width={30}
                  height={30}
                  stroke={colors.muted}
                  strokeWidth={2.5}
                />
                <Text style={styles.blockUserText}>
                  They won’t be able to message you or find your profile on
                  Laurie’s Love
                </Text>
              </View>
              <View style={styles.blockUserContainer}>
                <IconBellOff
                  width={30}
                  height={30}
                  stroke={colors.muted}
                  strokeWidth={2.5}
                />
                <Text style={styles.blockUserText}>
                  They won’t be notified that you blocked them
                </Text>
              </View>
              <View style={styles.blockUserContainer}>
                <IconTabUser
                  width={30}
                  height={30}
                  stroke={colors.muted}
                  strokeWidth={2.5}
                />
                <Text style={styles.blockUserText}>
                  You can unblock them anytime in their profile
                </Text>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title={isLoading ? 'Loading...' : 'Block'}
                onPress={handleBlockUser}
              />
            </View>
          </View>
        </BottomSheetCustom>
      )}
    </>
  );
};

export default MessagesTabDetails;
