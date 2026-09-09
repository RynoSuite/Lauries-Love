import {
  NavigatorScreenParams,
  NavigationProp,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/stack';
import { UserDBInput } from 'data/models';
import { AccountModel } from 'domain/models';

export type LoggedOutParamList = {
  Intro: undefined;
  OnBoarding: undefined;
  Authentication: NavigatorScreenParams<AuthenticationStackParamList>;
  Tutorial: NavigatorScreenParams<AuthenticationStackParamList>;
  Story: undefined;
  Notification: undefined;
  Profile: undefined;
  Connect: NavigatorScreenParams<ConnectStackParamList>;
  Donate: NavigatorScreenParams<DonateStackParamList>;
  Messages: NavigatorScreenParams<MessagesStackParamList>;
  Home: NavigatorScreenParams<HomeStackParamList>;
  QrCode: { originScreen: string };
  QrCodeStore: { originScreen: string };
};
export interface Item {
  hasBlockedMe: boolean;
  blockedByMe: boolean;
  deactivatedAt: number;
  uid: string;
  name: string;
  avatar: string;
  lastActiveAt: number;
  role: string;
  status: string;
  conversationId: string;
}
export type LoggedOutStackScreenProps<T extends keyof LoggedOutParamList> =
  NativeStackScreenProps<LoggedOutParamList, T>;

export type AuthenticationStackParamList = {
  login: undefined;
  CreateAccount: undefined;
  CreatePassword: undefined;
  VerifyEmail: { password: string };
  YourAddress: undefined;
  UserType: undefined;
  CancerType: undefined;
  SubCancerType: undefined;
  YourAge: undefined;
  YourGender: undefined;
  DiagnosedYear: undefined;
  RecommendedGroups: undefined;
  ForgotPassword?: { userEmail?: string };
  SignUpConfirm: undefined;
  ChangePassword: { user: AccountModel };
};

export type MessagesStackParamList = {
  CometChatMessages: { item: Item };
  ConversationListWithMessages: { item: Item };
  Notifications: undefined;
};

export type DonateStackParamList = {
  'donate-tab': { showHistory?: boolean } | undefined;
  'donate-tab-checkout': {
    amount: number;
    paymentType: string;
    inHonor?: boolean;
  };
  'donate-tab-invoice': {
    isNew?: boolean;
    itemId: string;
  };
  'donate-tab-join-the-fight': undefined;
};

export type HomeStackParamList = {
  'home-tab-main': undefined;
  'home-tab-create-post': undefined;
  'home-tab-post': undefined;
  'home-tab-tara-details': undefined;
};

export type RootStackParamList = LoggedOutParamList;
export type LoggedOutNavigation = NavigationProp<AuthenticationStackParamList>;
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
export type ConnectStackParamList = {
  QRScreen: undefined;
  MapView: { user?: any; filters?: any };
  // region: the map's current viewport, so the list can show the members
  // that are actually in view rather than an unrelated page of the community.
  ListView: { search?: any; filters: any; region?: any };
  DetailView: { user: any; fromExternal?: Boolean };
};
