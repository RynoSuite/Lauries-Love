import React, { FunctionComponent } from 'react';
import colors from 'styles/colors';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

// types
import { RootDonateTabParamList } from './DonateTabStacks.types';

// constants
import { PATHS_DONATE_TAB } from '../paths';
import { LIST_DONATE_TAB_SCREENS } from './DonateTabStacks.constants';

const Stack = createNativeStackNavigator<RootDonateTabParamList>();

const DonateTabStacks: FunctionComponent = () => {
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
    <Stack.Navigator initialRouteName={PATHS_DONATE_TAB.donateTabMain}>
      {LIST_DONATE_TAB_SCREENS.map(mainScreen => (
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

export default DonateTabStacks;
