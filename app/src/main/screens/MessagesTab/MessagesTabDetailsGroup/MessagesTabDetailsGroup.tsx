import React, { FunctionComponent, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Text,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';

// types
import { RootMessagesTabParamList } from 'main/navigators/MessagesTabStacks/MessagesTabStacks.types';

// providers
import { GroupChannelSendBirdType } from 'providers/ChatProvider/ChatProvider.types';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';
import ButtonModalTabs from 'components/ButtonModalTabs/ButtonModalTabs';
import AvatarMessagesTab from '../components/AvatarMessagesTab/AvatarMessagesTab';

// icons
import {
  IconGallery,
  IconLockProfile,
  IconTabUser,
} from 'assets/icons-auto/components';

// backend v2
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import {
  getGroupMembers,
  leaveGroup,
} from 'services/supabase/supabase.social';

// constants
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';

// styles
import colors from 'styles/colors';
import styles from './MessagesTabDetailsGroup.styles';
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';
import { useActionSheet } from 'providers/ActionSheetProvider/ActionSheetProvider';

type MessagesTabDetailsGroupProps = {
  navigation: NativeStackNavigationProp<RootMessagesTabParamList>;
};

const MessagesTabDetailsGroup: FunctionComponent<
  MessagesTabDetailsGroupProps
> = ({ navigation }) => {
  const { showSheet } = useActionSheet();
  const route =
    useRoute<
      RouteProp<RootMessagesTabParamList, 'messages-tab-details-group'>
    >();
  const { getChannels, groupChannels } = useChatProvider();
  const [channel, setChannel] = useState<GroupChannelSendBirdType | null>(null);

  const fetchChannel = async () => {
    if (!route.params?.channelUrl) return;

    if (SUPABASE_ENABLED) {
      // Supabase mode: the provider cache is the source of truth for the
      // channel shell; members are re-fetched fresh so the count is right.
      // No Sendbird SDK calls here.
      const found = groupChannels.find(
        c => c.url === route.params?.channelUrl,
      );
      if (found) setChannel(found);
      try {
        const members = await getGroupMembers(route.params.channelUrl);
        setChannel({
          ...(found || {
            url: route.params.channelUrl,
            name: '',
            coverUrl: '',
          }),
          members,
          memberCount: members.length,
        } as GroupChannelSendBirdType);
      } catch (error) {
        if (__DEV__) console.warn('Error fetching group members:', error);
      }
      return;
    }
  };

  const onLeave = async () => {
    if (SUPABASE_ENABLED) {
      // Supabase mode: remove the caller's membership row, refresh the
      // channel list, then land back on the messages list.
      try {
        if (route.params?.channelUrl) await leaveGroup(route.params.channelUrl);
        await getChannels();
        navigation.reset({
          index: 0,
          routes: [{ name: PATHS_MESSAGES_TAB.messagesTabMain }],
        });
      } catch (error) {
        if (__DEV__) console.warn('Error leaving group:', error);
      }
      return;
    }
  };

  const onLeaveGroup = () => {
    if (Platform.OS === 'ios')
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Leave group', 'Cancel'],
          destructiveButtonIndex: 0,
          cancelButtonIndex: 1,
        },
        buttonIndex => {
          if (buttonIndex === 0) onLeave();
        },
      );
    else
      showSheet({
        title: 'Leave group',
        message:
          'You will stop receiving messages from this group. Your messages stay where they are.',
        items: [
          {
            label: 'Leave group',
            destructive: true,
            onPress: () => onLeave(),
          },
        ],
      });
  };

  // Depend on the provider cache length: in Supabase mode the channel comes
  // from groupChannels, which may still be loading on first mount.
  useEffect(() => {
    fetchChannel();
  }, [groupChannels.length]);

  // Never return a blank screen: header + back button stay alive even while
  // the channel is still resolving (MessagesTabDetails pattern).
  return (
    <>
      <BackgroundScreen type={'messages'}>
        <HeaderTabScreen
          title="Details"
          onPressLeft={() => navigation.goBack()}
        />
        <View style={styles.container}>
          <View style={styles.userContainer}>
            <AvatarMessagesTab
              imageUrl={channel?.coverUrl || ''}
              width={120}
              height={120}
            />
            <View style={styles.infoContainer}>
              <Text style={styles.name}>{channel?.name || ''}</Text>
              <Text style={styles.birthday}>
                {channel?.members?.length || 0} Members
              </Text>
            </View>
          </View>
          <View style={styles.buttonsContainer}>
            <ButtonModalTabs
              Icon={IconGallery}
              label={'Media and docs'}
              iconProps={{
                stroke: colors.neutral[800],
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
                stroke: colors.neutral[800],
                strokeWidth: 2.5,
              }}
              label={'Members'}
              onPress={() => {
                navigation.navigate(
                  PATHS_MESSAGES_TAB.messagesTabMembersGroup,
                  {
                    channelUrl: route.params?.channelUrl || '',
                  },
                );
              }}
            />
            <ButtonModalTabs
              Icon={IconLockProfile}
              iconProps={{
                stroke: colors.error[500],
                strokeWidth: 2.5,
              }}
              label={'Leave group'}
              onPress={onLeaveGroup}
              isRightArrow={false}
              styleContainer={styles.blockUserButton}
              styleLabel={styles.labelBlockUserButton}
            />
          </View>
        </View>
      </BackgroundScreen>
    </>
  );
};

export default MessagesTabDetailsGroup;
