// types
import { RootMessagesTabParamList } from './MessagesTabStacks.types';

// screens
import MessagesTabMain from 'main/screens/MessagesTab/MessagesTabMain/MessagesTabMain';
import MessagesTabCreateChat from 'main/screens/MessagesTab/MessagesTabCreateChat/MessagesTabCreateChat';
import MessagesTabChat from 'main/screens/MessagesTab/MessagesTabChat/MessagesTabChat';
import MessagesTabDetails from 'main/screens/MessagesTab/MessagesTabDetails/MessagesTabDetails';
import MessagesTabCreateGroup from 'main/screens/MessagesTab/MessagesTabCreateGroup/MessagesTabCreateGroup';
import MessagesTabChatGroup from 'main/screens/MessagesTab/MessagesTabChatGroup/MessagesTabChatGroup';
import MessagesTabDetailsGroup from 'main/screens/MessagesTab/MessagesTabDetailsGroup/MessagesTabDetailsGroup';
import MessagesTabMediaAndDocs from 'main/screens/MessagesTab/MessagesTabMediaAndDocs/MessagesTabMediaAndDocs';
import MessagesTabJoinGroup from 'main/screens/MessagesTab/MessagesTabJoinGroup/MessagesTabJoinGroup';
import MessagesTabGroupFeed from 'main/screens/MessagesTab/MessagesTabGroupFeed/MessagesTabGroupFeed';
import MessagesTabMembersGroup from 'main/screens/MessagesTab/MessagesTabMembersGroup/MessagesTabMembersGroup';
import MessagesTabProfile from 'main/screens/MessagesTab/MessagesTabProfile/MessagesTabProfile';
import MessagesTabSupportTicket from 'main/screens/MessagesTab/MessagesTabSupportTicket/MessagesTabSupportTicket';

// paths
import { PATHS_MESSAGES_TAB } from '../paths';

export const LIST_MESSAGES_TAB_SCREENS: Array<{
  id: keyof RootMessagesTabParamList;
  name: keyof RootMessagesTabParamList;
  title: keyof RootMessagesTabParamList;
  component: React.ComponentType<any>;
  headerShown: boolean;
  gestureEnabled?: boolean;
}> = [
  {
    id: PATHS_MESSAGES_TAB.messagesTabMain,
    name: PATHS_MESSAGES_TAB.messagesTabMain,
    title: PATHS_MESSAGES_TAB.messagesTabMain,
    component: MessagesTabMain,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabCreateChat,
    name: PATHS_MESSAGES_TAB.messagesTabCreateChat,
    title: PATHS_MESSAGES_TAB.messagesTabCreateChat,
    component: MessagesTabCreateChat,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabChat,
    name: PATHS_MESSAGES_TAB.messagesTabChat,
    title: PATHS_MESSAGES_TAB.messagesTabChat,
    component: MessagesTabChat,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabDetails,
    name: PATHS_MESSAGES_TAB.messagesTabDetails,
    title: PATHS_MESSAGES_TAB.messagesTabDetails,
    component: MessagesTabDetails,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabCreateGroup,
    name: PATHS_MESSAGES_TAB.messagesTabCreateGroup,
    title: PATHS_MESSAGES_TAB.messagesTabCreateGroup,
    component: MessagesTabCreateGroup,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabChatGroup,
    name: PATHS_MESSAGES_TAB.messagesTabChatGroup,
    title: PATHS_MESSAGES_TAB.messagesTabChatGroup,
    component: MessagesTabChatGroup,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabDetailsGroup,
    name: PATHS_MESSAGES_TAB.messagesTabDetailsGroup,
    title: PATHS_MESSAGES_TAB.messagesTabDetailsGroup,
    component: MessagesTabDetailsGroup,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabMediaAndDocs,
    name: PATHS_MESSAGES_TAB.messagesTabMediaAndDocs,
    title: PATHS_MESSAGES_TAB.messagesTabMediaAndDocs,
    component: MessagesTabMediaAndDocs,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabGroupFeed,
    name: PATHS_MESSAGES_TAB.messagesTabGroupFeed,
    title: PATHS_MESSAGES_TAB.messagesTabGroupFeed,
    component: MessagesTabGroupFeed,
    headerShown: false,
    gestureEnabled: true,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabJoinGroup,
    name: PATHS_MESSAGES_TAB.messagesTabJoinGroup,
    title: PATHS_MESSAGES_TAB.messagesTabJoinGroup,
    component: MessagesTabJoinGroup,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabMembersGroup,
    name: PATHS_MESSAGES_TAB.messagesTabMembersGroup,
    title: PATHS_MESSAGES_TAB.messagesTabMembersGroup,
    component: MessagesTabMembersGroup,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabProfile,
    name: PATHS_MESSAGES_TAB.messagesTabProfile,
    title: PATHS_MESSAGES_TAB.messagesTabProfile,
    component: MessagesTabProfile,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_MESSAGES_TAB.messagesTabSupportTicket,
    name: PATHS_MESSAGES_TAB.messagesTabSupportTicket,
    title: PATHS_MESSAGES_TAB.messagesTabSupportTicket,
    component: MessagesTabSupportTicket,
    headerShown: false,
    gestureEnabled: false,
  },
];
