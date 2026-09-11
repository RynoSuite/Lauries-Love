export const PATHS_MESSAGES_TAB = {
  messagesTabMain: 'messages-tab-main',
  messagesTabCreateChat: 'messages-tab-create-chat',
  messagesTabChat: 'messages-tab-chat',
  messagesTabDetails: 'messages-tab-details',
  messagesTabCreateGroup: 'messages-tab-create-group',
  messagesTabChatGroup: 'messages-tab-chat-group',
  messagesTabDetailsGroup: 'messages-tab-details-group',
  messagesTabMediaAndDocs: 'messages-tab-media-and-docs',
  messagesTabJoinGroup: 'messages-tab-join-group',
  messagesTabGroupFeed: 'messages-tab-group-feed',
  messagesTabMembersGroup: 'messages-tab-members-group',
  messagesTabProfile: 'messages-tab-profile',
  messagesTabSupportTicket: 'messages-tab-support-ticket',
} as const;

export const PATHS_PROFILE_TAB = {
  profileTabMain: 'profile-tab-main',
  profileTabDetails: 'profile-tab-details',
  profileTabUpdateEmail: 'profile-tab-update-email',
  profileTabUpdatePhone: 'profile-tab-update-phone',
  profileTabUpdatePassword: 'profile-tab-update-password',
  profileTabUpdateFullName: 'profile-tab-update-full-name',
  profileTabQR: 'profile-tab-qr',
  profileTabSupportInbox: 'profile-tab-support-inbox',
  profileTabSupportTicket: 'profile-tab-support-ticket',
  profileTabSupportStaff: 'profile-tab-support-staff',
} as const;

export const PATHS_DONATE_TAB = {
  donateTabMain: 'donate-tab',
  donateTabCheckout: 'donate-tab-checkout',
  donateTabInvoice: 'donate-tab-invoice',
  donateTabJoinTheFight: 'donate-tab-join-the-fight',
} as const;

export const PATHS_HOME_TAB = {
  homeTabMain: 'home-tab-main',
  homeTabCreatePost: 'home-tab-create-post',
  homeTabPost: 'home-tab-post',
  homeTabTaraDetails: 'home-tab-tara-details',
  homeTabNotifications: 'home-tab-notifications',
} as const;

export const PATHS_AUTH_SCREENS = {
  login: 'login',
  CreateAccount: 'CreateAccount',
  CreatePassword: 'CreatePassword',
  VerifyEmail: 'VerifyEmail',
  YourAddress: 'YourAddress',
  UserType: 'UserType',
  CancerType: 'CancerType',
  SubCancerType: 'SubCancerType',
  YourAge: 'YourAge',
  YourGender: 'YourGender',
  DiagnosedYear: 'DiagnosedYear',
  ForgotPassword: 'ForgotPassword',
  SignUpConfirm: 'SignUpConfirm',
  ChangePassword: 'ChangePassword',
  RecommendedGroups: 'RecommendedGroups',
} as const;

export const ONBOARDING_NAMES_SCREEN = [
  PATHS_AUTH_SCREENS.CreateAccount,
  PATHS_AUTH_SCREENS.CreatePassword,
  PATHS_AUTH_SCREENS.VerifyEmail,
  PATHS_AUTH_SCREENS.YourAddress,
  PATHS_AUTH_SCREENS.UserType,
  PATHS_AUTH_SCREENS.CancerType,
  PATHS_AUTH_SCREENS.SubCancerType,
  PATHS_AUTH_SCREENS.YourAge,
  PATHS_AUTH_SCREENS.YourGender,
  PATHS_AUTH_SCREENS.DiagnosedYear,
  PATHS_AUTH_SCREENS.RecommendedGroups,
] as string[];
