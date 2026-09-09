import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';

// types
import { RootHomeTabParamList } from 'main/navigators/HomeTabStacks/HomeTabStacks.types';

// hooks
import { formatTime } from 'utils/formats';
import { getFileStorageAmplify } from 'utils/amplify-storage';
import { makeAxiosHttpClient } from 'main/factories/http';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { publicUrlFor } from 'services/supabase/supabase.storage';

// components
import { Notification } from '../../notifications.screen';

// constants
import { appConfig } from 'main/config/app.config';
import { PATHS_HOME_TAB } from 'main/navigators/paths';

// styles
import styles from './PostNotification.styles';
import AvatarMessagesTab from 'main/screens/MessagesTab/components/AvatarMessagesTab/AvatarMessagesTab';

type Props = {
  notification: Notification;
  getNotifications: () => Promise<void>;
};

export default function PostNotification({
  notification,
  getNotifications,
}: Props) {
  const navigation =
    useNavigation<
      NavigationProp<RootHomeTabParamList, 'home-tab-notifications'>
    >();
  const [profilePicture, setProfilePicture] = useState<URL | undefined>();

  useEffect(() => {
    getProfilePicture();
  }, []);

  async function getProfilePicture() {
    if (SUPABASE_ENABLED) {
      // Supabase avatars: public-bucket url — no Amplify signed-url call.
      const publicUrl = publicUrlFor('avatars', notification.profilePicture);
      setProfilePicture(publicUrl ? new URL(publicUrl) : undefined);
      return;
    }
    const profilePicture = await getFileStorageAmplify(
      notification.profilePicture,
    );
    setProfilePicture(profilePicture);
  }

  async function handleRemove() {
    try {
      const response = await makeAxiosHttpClient().request({
        url: `${appConfig.apiUrl}/notifications/${notification.id}`,
        method: 'put',
        body: {
          active: false,
        },
      });

      if (response.statusCode === 200) {
        await getNotifications();
      }

      if (notification.postId)
        navigation.navigate(PATHS_HOME_TAB.homeTabPost, {
          channelUrl: notification.postId,
          messageId: notification.messageId || '',
          isNowOpenKeyboard: false,
        });
    } catch (error) {
      throw new Error(`Error confirming friend request: ${error}`);
    }
  }

  // Empty rather than a placeholder image: AvatarMessagesTab falls through to
  // initials on magenta, which is what a member without a photo should look
  // like everywhere in the app.
  const avatarUrl = profilePicture ? profilePicture.toString() : '';

  return (
    <TouchableOpacity onPress={handleRemove} style={styles.container}>
      <AvatarMessagesTab
        imageUrl={avatarUrl}
        width={48}
        height={48}
        name={notification.firstName ?? ''}
      />
      <View style={{ flex: 1 }}>
        <View style={styles.nameAndType}>
          <Text numberOfLines={2}>
            <Text numberOfLines={1} style={styles.fullNameText}>
              {notification.firstName}
            </Text>{' '}
            <Text style={[styles.typeText, { width: '30%' }]}>
              {notification.description === 'NEW_LIKE' && 'liked your post.'}
              {notification.description === 'NEW_MESSAGE' &&
                'commented on your post.'}
              {notification.description === 'NEW_MENTION' &&
                'mentioned you in a post.'}
              {notification.description === 'WELCOME' &&
                (notification.content || 'Welcome to the community.')}
              {/* {notification.description === 'NEW_MESSAGE' &&
              notification.content &&
              notification.content.length > 40
                ? notification.content.substring(0, 40) + '...'
                : notification.description === 'NEW_MESSAGE'
                ? notification.content
                : ''} */}
              <Text style={styles.timeText}>
                {' '}
                {formatTime(notification.createdAt)}
              </Text>
            </Text>
          </Text>
        </View>
        {notification.message && (
          <View style={styles.messageContainer}>
            <Text numberOfLines={1} style={styles.messageText}>
              {notification.message}
            </Text>
            <Text style={styles.timeText}>
              {formatTime(notification.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
