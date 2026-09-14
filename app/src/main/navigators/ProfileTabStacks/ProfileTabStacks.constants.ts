// types
import { RootProfileTabParamList } from './ProfileTabStacks.types';

// screens
import ProfileTabMain from 'main/screens/ProfileTab/ProfileTabMain/ProfileTabMain';
import ProfileTabDetails from 'main/screens/ProfileTab/ProfileTabDetails/ProfileTabDetails';
import ProfileTabUpdateEmail from 'main/screens/ProfileTab/ProfileTabUpdateEmail/ProfileTabUpdateEmail';
import ProfileTabUpdatePhone from 'main/screens/ProfileTab/ProfileTabUpdatePhone/ProfileTabUpdatePhone';
import ProfileTabMainUpdatePassword from 'main/screens/ProfileTab/ProfileTabMainUpdatePassword/ProfileTabMainUpdateFullName';
import ProfileTabMainUpdateFullName from 'main/screens/ProfileTab/ProfileTabMainUpdateFullName/ProfileTabMainUpdateFullName';
import ProfileTabQR from 'main/screens/ProfileTab/ProfileTabQR/ProfileTabQR';

// constants
import { PATHS_PROFILE_TAB } from '../paths';

export const LIST_PROFILE_TAB_SCREENS: Array<{
  id: keyof RootProfileTabParamList;
  name: keyof RootProfileTabParamList;
  title: keyof RootProfileTabParamList;
  component: React.ComponentType<any>;
  headerShown: boolean;
  gestureEnabled?: boolean;
}> = [
  {
    id: PATHS_PROFILE_TAB.profileTabMain,
    name: PATHS_PROFILE_TAB.profileTabMain,
    title: PATHS_PROFILE_TAB.profileTabMain,
    component: ProfileTabMain,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_PROFILE_TAB.profileTabDetails,
    name: PATHS_PROFILE_TAB.profileTabDetails,
    title: PATHS_PROFILE_TAB.profileTabDetails,
    component: ProfileTabDetails,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_PROFILE_TAB.profileTabUpdateEmail,
    name: PATHS_PROFILE_TAB.profileTabUpdateEmail,
    title: PATHS_PROFILE_TAB.profileTabUpdateEmail,
    component: ProfileTabUpdateEmail,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_PROFILE_TAB.profileTabUpdatePhone,
    name: PATHS_PROFILE_TAB.profileTabUpdatePhone,
    title: PATHS_PROFILE_TAB.profileTabUpdatePhone,
    component: ProfileTabUpdatePhone,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_PROFILE_TAB.profileTabUpdatePassword,
    name: PATHS_PROFILE_TAB.profileTabUpdatePassword,
    title: PATHS_PROFILE_TAB.profileTabUpdatePassword,
    component: ProfileTabMainUpdatePassword,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_PROFILE_TAB.profileTabUpdateFullName,
    name: PATHS_PROFILE_TAB.profileTabUpdateFullName,
    title: PATHS_PROFILE_TAB.profileTabUpdateFullName,
    component: ProfileTabMainUpdateFullName,
    headerShown: false,
    gestureEnabled: false,
  },
  {
    id: PATHS_PROFILE_TAB.profileTabQR,
    name: PATHS_PROFILE_TAB.profileTabQR,
    title: PATHS_PROFILE_TAB.profileTabQR,
    component: ProfileTabQR,
    headerShown: false,
    gestureEnabled: false,
  },
];
