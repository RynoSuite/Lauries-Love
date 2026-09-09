import React, { Fragment, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// types
import { Notification as NotificationRequest } from 'data/models';

// hooks
import useNotificationsScreen from './useNotificationsScreen';

// helpers
import { makeAxiosHttpClient } from 'main/factories/http';

// components
import PostNotification from './components/PostNotification/PostNotification';
import RequestNotification from './components/RequestNotification/RequestNotification';
import SkeletonNotification from './components/SkeletonNotification/SkeletonNotification';

// constants
import { appConfig } from 'main/config/app.config';

// images
import ChatBubbleImage from '../../../assets/images/chat-bubble.png';
import NoNotificationsImage from '../../../assets/images/no-notifications.png';

// icons
import {
  IconArrowLeft,
  IconLayout,
  IconUserPlus,
} from 'assets/icons-auto/components';

// styles
import colors from 'styles/colors';
import styles from './notifications.styles';

export interface Notification {
  id: string;
  description: string;
  firstName: string;
  profilePicture: string;
  createdAt: string;
  senderId: string;
  message?: string;
  content?: string;
  postId?: string;
  messageId?: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { notificationSenders, setNotificationSenders } =
    useNotificationsScreen();

  const [section, setSection] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    getNotifications();
  }, [notificationSenders.length]);

  async function getNotifications() {
    try {
      const response = await makeAxiosHttpClient().request({
        url: `${appConfig.apiUrl}/notifications`,
        method: 'get',
      });

      const notifications: Notification[] = (
        response.body.data as NotificationRequest[]
      )
        .filter(item => item.active)
        .map(item => {
          const [_type, postId, messageId] =
            item.notificationObject.redirect?.split('/') || [];

          return {
            createdAt: item.createdAt,
            id: item.id,
            description: item.notificationObject?.entityType?.description || '',
            firstName:
              item.notificationObject.notificationChange.actor.firstName || '',
            senderId: item.notificationObject?.entity || '',
            profilePicture:
              item.notificationObject.notificationChange.actor.profilePicture ||
              '',
            content: item.notificationObject.content,
            postId,
            messageId,
          };
        });

      setNotifications(notifications);
      setIsLoading(false);
    } catch (error) {
      throw new Error(`Error getting notifications: ${error}`);
    }
  }

  function groupNotifications(notifications: Notification[]) {
    const grouped: {
      Today: Notification[];
      Yesterday: Notification[];
      'Last Week': Notification[];
    } = {
      Today: [],
      Yesterday: [],
      'Last Week': [],
    };

    function startOfDay(date: Date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const now = new Date();

    const startOfToday = startOfDay(now);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfSevenDaysAgo = new Date(now);
    startOfSevenDaysAgo.setDate(startOfSevenDaysAgo.getDate() - 7);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);

      if (notificationDate >= startOfToday) {
        grouped.Today.push(notification);
      } else if (
        notificationDate >= startOfYesterday &&
        notificationDate < startOfToday
      ) {
        grouped.Yesterday.push(notification);
      } else if (notificationDate >= startOfSevenDaysAgo) {
        grouped['Last Week'].push(notification);
      }
    });

    return grouped;
  }

  function formatTitle() {
    switch (section) {
      case 'posts':
        return 'Post notifications';
      case 'requests':
        return 'Friend requests';
      default:
        break;
    }
  }

  function formatMessage() {
    let image;
    let title;
    let description;
    switch (section) {
      case 'posts':
        image = ChatBubbleImage;
        title = 'It’s quiet here';
        description =
          "Looks like there are no notifications in this category. Try 'All' to view everything.";
        break;
      case 'requests':
        image = ChatBubbleImage;
        title = 'It’s quiet here';
        description = 'You have no friend request yet.';
        break;
      default:
        image = NoNotificationsImage;
        title = 'No Notifications';
        description = 'You have no notifications yet.';
        break;
    }

    return { image, title, description };
  }

  function renderNotification(notification: Notification) {
    const isLoadingSender = notificationSenders.some(
      sender => sender.senderId === notification.senderId,
    );

    // Two vocabularies reach this screen. The database triggers emit
    // POST_REACTION / POST_COMMENT / MESSAGE / FRIEND_REQUEST / FRIEND_ACCEPT;
    // the app's own sendNotification still writes the older NEW_* names. This
    // build only knew the older ones, and everything else fell through to
    // `default: return null` — so a bell reading 42 opened onto an empty
    // screen. Both vocabularies are handled, and the default now renders the
    // row rather than dropping it: a notification nobody can see is worse than
    // one with imperfect wording.
    switch (notification.description) {
      case 'FRIEND_REQUEST':
      case 'NEW_FRIEND_REQUEST':
        return (
          <RequestNotification
            isLoading={isLoadingSender}
            notification={notification}
            getNotifications={getNotifications}
            handleConfirm={() => {
              setNotificationSenders(state => {
                const isSender = state.some(
                  sender => sender.senderId === notification.senderId,
                );
                if (isSender) return state;

                return [...state, notification];
              });
            }}
          />
        );
      default:
        return (
          <PostNotification
            notification={notification}
            getNotifications={getNotifications}
          />
        );
    }
  }

  function renderAll({ item }: { item: [string, Notification[]] }) {
    const [title, notifications] = item;

    if (notifications.length === 0) return null;

    return (
      <View style={{ gap: 8 }}>
        <Text style={[{ marginBottom: 4 }, styles.sectionTitle]}>{title}</Text>
        {notifications.map((notification, key) => (
          <Fragment key={`${notification.id}-${key}`}>
            {renderNotification(notification)}
          </Fragment>
        ))}
      </View>
    );
  }

  const filteredNotifications = notifications.filter(notification => {
    if (section === 'all') {
      return true;
    }
    if (section === 'requests') {
      return (
        notification.description === 'FRIEND_REQUEST' ||
        notification.description === 'NEW_FRIEND_REQUEST'
      );
    }
    if (section === 'posts') {
      // Everything that is not a request belongs here, rather than a list of
      // known types that silently drops the rest.
      return (
        notification.description !== 'FRIEND_REQUEST' &&
        notification.description !== 'NEW_FRIEND_REQUEST'
      );
    }
    return false;
  });

  const groupedNotifications = groupNotifications(notifications);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Notifications</Text>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setSection('all')}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  section === 'all' ? colors.magenta : colors.surface2,
              },
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color:
                    section === 'all' ? colors.white : colors.muted,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSection('posts')}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  section === 'posts'
                    ? colors.magenta
                    : colors.surface2,
              },
            ]}
          >
            <IconLayout
              width={14}
              height={14}
              stroke={
                section === 'posts' ? colors.white : colors.muted
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                { color: section === 'posts' ? colors.white : colors.muted },
              ]}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSection('requests')}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  section === 'requests'
                    ? colors.magenta
                    : colors.surface2,
              },
            ]}
          >
            <IconUserPlus
              width={14}
              height={14}
              stroke={
                section === 'requests'
                  ? colors.white
                  : colors.muted
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                { color: section === 'requests' ? colors.white : colors.muted },
              ]}
            >
              Requests
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <FlatList
            data={Array(6).fill('loading')}
            keyExtractor={(_item, index) => index.toString()}
            renderItem={() => <SkeletonNotification />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationList}
            ListHeaderComponent={
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.sectionTitle}>Today</Text>
              </View>
            }
          />
        ) : section === 'all' && notifications.length > 0 ? (
          <FlatList
            data={Object.entries(groupedNotifications)}
            keyExtractor={([key]) => key}
            renderItem={renderAll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationSection}
          />
        ) : filteredNotifications.length > 0 ? (
          <FlatList
            data={filteredNotifications}
            keyExtractor={item => item.id}
            renderItem={({ item }) => renderNotification(item)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationList}
            ListHeaderComponent={
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.sectionTitle}>{formatTitle()}</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyNotificationContainer}>
            <View style={styles.emptyNotificationContent}>
              <Image source={formatMessage().image} />
              <View style={{ gap: 8, alignItems: 'center' }}>
                <Text style={styles.emptyNotificationText}>
                  {formatMessage().title}
                </Text>
                <Text style={styles.emptyNotificationDescription}>
                  {formatMessage().description}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
