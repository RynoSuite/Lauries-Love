import React, { FunctionComponent } from 'react';
import colors from 'styles/colors';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

// types
import { RootHomeTabParamList } from './HomeTabStacks.types';

// constants
import { LIST_HOME_TAB_SCREENS } from './HomeTabStacks.constants';
import { PATHS_HOME_TAB } from '../paths';

const Stack = createNativeStackNavigator<RootHomeTabParamList>();

const HomeTabStacks: FunctionComponent = () => {
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
    <Stack.Navigator initialRouteName={PATHS_HOME_TAB.homeTabMain}>
      {LIST_HOME_TAB_SCREENS.map(mainScreen => (
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

export default HomeTabStacks;
