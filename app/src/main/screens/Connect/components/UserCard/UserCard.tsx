import { Region } from 'react-native-maps';
import { Text, TouchableOpacity, View } from 'react-native';
import AvatarMessagesTab from 'main/screens/MessagesTab/components/AvatarMessagesTab/AvatarMessagesTab';
import { CommonActions, useNavigation } from '@react-navigation/native';
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';

import colors from 'styles/colors';
import styles from './UserCard.styles';
import { User } from '../../Map/map.screen';
import { formatGender } from 'utils/formats';
import { PATHS_MESSAGES_TAB } from 'main/navigators/paths';
import { IconMiddleDot } from 'assets/icons-auto/components';
import { getFileStorageAmplify } from 'utils/amplify-storage';
import { publicUrlFor } from 'services/supabase/supabase.storage';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { useChatProvider } from 'providers/ChatProvider/ChatProvider';
import { useCountry } from 'presentation/hooks';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { findOrCreateDirectConversation } from 'services/supabase/supabase.chat';

type Props = {
  user: User;
  setInitialRegion?: Dispatch<SetStateAction<Region>>;
  /** Dismiss the card. Tapping the map also closes it, but that is not
      discoverable on a phone, and the card covers the pin you just tapped. */
  onClose?: () => void;
};

// Perf: signed S3 URLs are valid for 7 days — cache them for the session so
// every card mount (list scroll, map pin taps) doesn't re-run Amplify signing
// and an extra setState render per card. Failed lookups are NOT cached, so
// retry-on-remount behavior is unchanged.
const profilePictureCache = new Map<string, URL>();

// Perf: React.memo — cards receive stable user object references from the
// screens' memoized lists, so unrelated screen re-renders (typing in search,
// map region changes) no longer re-render every card.
export default React.memo(function UserCard({
  user,
  setInitialRegion,
  onClose,
}: Props) {
  const navigation = useNavigation();
  const { showToast } = useToastProvider();
  const { groupChannels, getChannels } = useChatProvider();

  const { allCountries } = useCountry();

  const [profilePicture, setProfilePicture] = useState<URL | undefined>(() =>
    user.profilePicture ? profilePictureCache.get(user.profilePicture) : undefined,
  );
  const [isLoadingSendMessage, setIsLoadingSendMessage] = useState(false);

  const isFriend = useMemo(
    () => user.role?.description.toLowerCase().includes('friend') || false,
    [user.role],
  );

  useEffect(() => {
    let active = true;

    const cached = user.profilePicture
      ? profilePictureCache.get(user.profilePicture)
      : undefined;
    if (cached) {
      setProfilePicture(prev => (prev === cached ? prev : cached));
      return;
    }

    if (SUPABASE_ENABLED) {
      // Supabase avatars: public-bucket url — no Amplify signed-url
      // round-trip (which fails silently in Supabase mode).
      const publicUrl = publicUrlFor('avatars', user.profilePicture);
      const url = publicUrl ? new URL(publicUrl) : undefined;
      if (url) profilePictureCache.set(user.profilePicture, url);
      setProfilePicture(url);
      return;
    }

    getFileStorageAmplify(user.profilePicture).then(url => {
      if (url) profilePictureCache.set(user.profilePicture, url);
      if (active) setProfilePicture(url);
    });

    return () => {
      active = false;
    };
  }, [user.profilePicture]);

  function toChatUser(channelUrl: string, userId: string) {
    navigation.dispatch(
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

  function handleDetails() {
    if (setInitialRegion) {
      setInitialRegion({
        latitude: user.geoLocation?.latitude || 0,
        latitudeDelta: 0.1,
        longitude: user.geoLocation?.longitude || 0,
        longitudeDelta: 0.1,
      });
    }

    navigation.navigate('Connect', {
      screen: 'DetailView',
      params: {
        user: user,
        // no fromExternal param needed here
        // as this is the main user card in the map
      },
    });
  }

  // Empty string rather than a placeholder image, so AvatarMessagesTab falls
  // through to its initials-on-magenta branch instead of showing a white
  // "not found" tile.
  const avatarUrl = profilePicture ? profilePicture.toString() : '';

  // Perf: memoized country lookup instead of scanning all countries per render.
  const country = useMemo(
    () =>
      allCountries.find(country => country.code === user.country)?.name ||
      'Unknown Country',
    [allCountries, user.country],
  );

  return (
    <View style={styles.container}>
      {onClose && (
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Close"
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      )}
      <View>
        <View style={styles.row}>
          <AvatarMessagesTab
            imageUrl={avatarUrl}
            width={49}
            height={49}
            name={user.firstName ?? ''}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.headerRow}>
              <Text style={styles.headerText}>
                {user.firstName?.split(' ')[0]} ({user.age})
              </Text>
              <View style={styles.cityStateContainer}>
                <Text numberOfLines={1} style={styles.cityStateText}>
                  {user.city}, {country}
                </Text>
              </View>
            </View>

            <Text style={styles.detailsText}>
              {formatGender(user.gender)} {user.role?.description}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.userRow}>
        <Text numberOfLines={1} style={styles.userText}>
          {user?.diagnosisTypes[0]?.description}
        </Text>
        {!isFriend && (
          <>
            {user.diagnosisYear && (
              <IconMiddleDot width={8} height={8} fill={colors.muted} />
            )}
            <Text style={styles.userText}>{user.diagnosisYear}</Text>
          </>
        )}
      </View>
      <View style={styles.row}>
        <TouchableOpacity
          disabled={isLoadingSendMessage}
          onPress={handleMessage}
          style={{ flex: 1 }}
        >
          <View style={styles.buttonOutlinedContainer}>
            <View style={styles.buttonInnerContainer}>
              <Text style={styles.sendMessageText}>
                {isLoadingSendMessage ? 'Connecting...' : 'Send message'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDetails} style={{ flex: 1 }}>
          <View style={styles.buttonContainer}>
            <Text style={styles.viewProfileText}>View profile</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
});
