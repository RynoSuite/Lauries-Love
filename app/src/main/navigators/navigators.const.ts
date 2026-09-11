import {
  PATHS_DONATE_TAB,
  PATHS_PROFILE_TAB,
  PATHS_MESSAGES_TAB,
  PATHS_HOME_TAB,
} from './paths';

export const LIST_HIDE_TAB_BAR: string[] = [
  // profile tab
  PATHS_PROFILE_TAB.profileTabQR,
  PATHS_PROFILE_TAB.profileTabUpdateEmail,
  PATHS_PROFILE_TAB.profileTabUpdatePhone,
  PATHS_PROFILE_TAB.profileTabUpdatePassword,
  PATHS_PROFILE_TAB.profileTabUpdateFullName,
  // messages tab
  PATHS_MESSAGES_TAB.messagesTabCreateChat,
  PATHS_MESSAGES_TAB.messagesTabChat,
  PATHS_MESSAGES_TAB.messagesTabDetails,
  PATHS_MESSAGES_TAB.messagesTabCreateGroup,
  PATHS_MESSAGES_TAB.messagesTabChatGroup,
  PATHS_MESSAGES_TAB.messagesTabDetailsGroup,
  PATHS_MESSAGES_TAB.messagesTabMediaAndDocs,
  PATHS_MESSAGES_TAB.messagesTabMembersGroup,
  PATHS_MESSAGES_TAB.messagesTabProfile,
  // donate tab
  PATHS_DONATE_TAB.donateTabCheckout,
  PATHS_DONATE_TAB.donateTabInvoice,
  PATHS_DONATE_TAB.donateTabJoinTheFight,
  // home tab
  PATHS_HOME_TAB.homeTabCreatePost,
  PATHS_HOME_TAB.homeTabPost,
  PATHS_HOME_TAB.homeTabTaraDetails,
];
