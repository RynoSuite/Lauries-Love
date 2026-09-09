import React, { FunctionComponent, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Dimensions,
  Platform,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

import styles from './LoggedIn.styles';
import { useUnreadMessages } from 'presentation/hooks';
import { ConnectNavigator } from '../connect';
import { LIST_HIDE_TAB_BAR } from '../navigators.const';
import HomeTabStacks from '../HomeTabStacks/HomeTabStacks';
import ProfileTabStacks from '../ProfileTabStacks/ProfileTabStacks';
import MessagesTabStacks from '../MessagesTabStacks/MessagesTabStacks';
import DonateTabStacks from '../DonateTabStacks/DonateTabStacks';
import {
  ConnectTabIcon,
  MessagesTabIcon,
  StoryTabIcon,
  DonateTabIcon,
  ProfileTabIcon,
} from './customTab';

const Tab = createBottomTabNavigator();
const WIDTH = Dimensions.get('window').width;

type BottomTabNavigatorProps = {
  currentRouteName: string | null;
};

const BottomTabNavigator: FunctionComponent<BottomTabNavigatorProps> = ({
  currentRouteName,
}) => {
  const { unreadMessages } = useUnreadMessages();

  const isHideTabBar = useMemo(
    () => currentRouteName && LIST_HIDE_TAB_BAR.includes(currentRouteName),
    [currentRouteName],
  );

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarShowLabel: false,
        headerShown: false,
        // Rebuild fix (P1 perf): freeze background tabs so provider state
        // changes don't re-render all five tab stacks at once, and mount
        // tabs lazily on first visit.
        freezeOnBlur: true,
        lazy: true,
        tabBarStyle: [
          styles.tabBar,
          isHideTabBar && styles.tabBarHide,
          {
            paddingBottom: Platform.OS === 'ios' ? 88 : 80,
          },
        ],
        tabBarIconStyle: {
          width: WIDTH / 5 - 1,
          height: 50,
          marginTop: Platform.OS === 'ios' ? 15 : 8,
          paddingBottom: Platform.OS === 'ios' ? 30 : 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeTabStacks}
        options={{
          tabBarIcon: StoryTabIcon,
          title: 'Home',
          headerShown: false,
          tabBarButton: props => (
            <TouchableOpacity {...(props as TouchableOpacityProps)} />
          ),
        }}
      />
      <Tab.Screen
        name="Connect"
        component={ConnectNavigator}
        // Rebuild fix (P1 perf): removed the tabPress listener that RESET the
        // whole Connect stack on every tab press — it remounted the map (GPS
        // fetch + full users load) from scratch each visit.
        options={{
          tabBarIcon: ConnectTabIcon,
          title: 'Connect',
          headerShown: false,
          tabBarButton: props => (
            <TouchableOpacity {...(props as TouchableOpacityProps)} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesTabStacks}
        options={({ route }) => ({
          tabBarIcon: MessagesTabIcon,
          title: 'Messages',
          headerShown: false,
          // The same signal the bell gives for notifications: a magenta count
          // on the icon. Undefined rather than 0 — react-navigation renders a
          // badge for any defined value, including an empty one.
          tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
          tabBarBadgeStyle: styles.tabBadge,
          tabBarButton: props => (
            <TouchableOpacity {...(props as TouchableOpacityProps)} />
          ),
        })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileTabStacks}
        options={{
          tabBarIcon: ProfileTabIcon,
          headerShown: false,
          tabBarButton: props => (
            <TouchableOpacity {...(props as TouchableOpacityProps)} />
          ),
        }}
      />
      <Tab.Screen
        name="Donate"
        component={DonateTabStacks}
        options={{
          tabBarIcon: DonateTabIcon,
          title: 'Donate',
          headerShown: false,
          tabBarButton: props => (
            <TouchableOpacity {...(props as TouchableOpacityProps)} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
