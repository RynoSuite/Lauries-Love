import React, { FunctionComponent } from 'react';
import colors from 'styles/colors';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

// types
import { RootProfileTabParamList } from './ProfileTabStacks.types';

// constants
import { LIST_PROFILE_TAB_SCREENS } from './ProfileTabStacks.constants';
import { PATHS_PROFILE_TAB } from '../paths';

const Stack = createNativeStackNavigator<RootProfileTabParamList>();

const ProfileTabStacks: FunctionComponent = () => {
  const options = (
    headerShown: boolean,
    gestureEnabled = true,
  ): NativeStackNavigationOptions => ({
    headerShown,
    gestureEnabled,
    // Without this the native stack paints a white card behind every screen.
    contentStyle: { backgroundColor: colors.ground },
  });
  return (
    <Stack.Navigator initialRouteName={PATHS_PROFILE_TAB.profileTabMain}>
      {LIST_PROFILE_TAB_SCREENS.map(mainScreen => (
        <Stack.Screen
          key={`screen_${mainScreen.name}`}
          name={mainScreen.name}
          component={mainScreen.component}
          options={options(mainScreen.headerShown, mainScreen.gestureEnabled)}
        />
      ))}
    </Stack.Navigator>
  );
};

export default ProfileTabStacks;
