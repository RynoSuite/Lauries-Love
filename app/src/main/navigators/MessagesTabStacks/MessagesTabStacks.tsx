import React, { FunctionComponent } from 'react';
import colors from 'styles/colors';
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from '@react-navigation/native-stack';

// types
import { RootMessagesTabParamList } from './MessagesTabStacks.types';

// constants
import { PATHS_MESSAGES_TAB } from '../paths';
import { LIST_MESSAGES_TAB_SCREENS } from './MessagesTabStacks.constants';

const Stack = createNativeStackNavigator<RootMessagesTabParamList>();

const MessagesTabStacks: FunctionComponent = () => {
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
    <Stack.Navigator
      initialRouteName={PATHS_MESSAGES_TAB.messagesTabMain}
      screenOptions={{
        headerShown: false,
      }}
    >
      {LIST_MESSAGES_TAB_SCREENS.map(mainScreen => (
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

export default MessagesTabStacks;
