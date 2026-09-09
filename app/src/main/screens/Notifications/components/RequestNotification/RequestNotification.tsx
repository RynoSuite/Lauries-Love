import React, { useEffect, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// utils
import { formatTime } from 'utils/formats';
import { getFileStorageAmplify } from 'utils/amplify-storage';
import { makeAxiosHttpClient } from 'main/factories/http';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { publicUrlFor } from 'services/supabase/supabase.storage';

// components
import { Notification } from '../../notifications.screen';

// constants
import { appConfig } from 'main/config/app.config';

// styles
import styles from './RequestNotification.styles';
import useFriendsUserDB from 'providers/UserDBProvider/useFriendsUserDB';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import AvatarMessagesTab from 'main/screens/MessagesTab/components/AvatarMessagesTab/AvatarMessagesTab';

type Props = {
  isLoading: boolean;
  notification: Notification;
  getNotifications: () => Promise<void>;
  handleConfirm: () => void;
};

export default function RequestNotification({
  isLoading,
  notification,
  getNotifications,
  handleConfirm,
}: Props) {
  const { userDB } = useUserDBProvider();
  const { confirmFriend } = useFriendsUserDB({
    friendId: notification.senderId || '',
    friendCognitoId: userDB?.cognitoId || '',
  });
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
        url: `${appConfig.apiUrl}/users/${notification.senderId}/friend-requests`,
        method: 'put',
        body: { status: 'rejected' },
      });

      if (response.statusCode === 200) {
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
      }
    } catch (error) {
      throw new Error(`Error confirming friend request: ${error}`);
    }
  }

  const imageSource: ImageSourcePropType = profilePicture
    ? { uri: profilePicture.toString(), cache: 'reload' }
    : require('../../../../../assets/images/image-not-found.png');

  function handleRequest() {
    handleConfirm();

    confirmFriend();
  }

  // Empty rather than a placeholder image: AvatarMessagesTab falls through to
  // initials on magenta, matching every other avatar in the app. This was
  // referencing an `avatarUrl` that was never declared — a ReferenceError as
  // soon as the row rendered, which it never got to do while no notification
  // type routed here.
  const avatarUrl = profilePicture ? profilePicture.toString() : '';

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <AvatarMessagesTab
        imageUrl={avatarUrl}
        width={48}
        height={48}
        name={notification.firstName ?? ''}
      />

        <View style={styles.textContainer}>
          <Text style={styles.fullNameText}>{notification.firstName}</Text>

          <Text numberOfLines={2} style={styles.requestText}>
            requested to be friends.{' '}
            <Text style={styles.timeText}>
              {formatTime(notification.createdAt)}
            </Text>
          </Text>

          {notification.description === 'like' && (
            <Text style={styles.timeText}>
              {formatTime(notification.createdAt)}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          disabled={isLoading}
          onPress={handleRequest}
          style={styles.confirmButton}
        >
          <Text style={styles.confirmText}>
            {isLoading ? 'Loading...' : 'Confirm'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRemove} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
