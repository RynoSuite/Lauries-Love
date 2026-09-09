import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ConnectStackParamList } from 'types/navigation';

import MapScreen from 'main/screens/Connect/Map/map.screen';
import ListScreen from 'main/screens/Connect/List/list.screen';
import DetailsScreen from 'main/screens/Connect/Details/details.screen';
import colors from 'styles/colors';

const ConnectStack = createStackNavigator<ConnectStackParamList>();

const ConnectNavigator = () => {
  return (
    <ConnectStack.Navigator
      initialRouteName="MapView"
      screenOptions={{
        // Native stacks default to a white card, which flashes on every push.
        cardStyle: { backgroundColor: colors.ground }, headerShown: false }}
    >
      <ConnectStack.Screen name="MapView" component={MapScreen} />
      <ConnectStack.Screen name="ListView" component={ListScreen} />
      <ConnectStack.Screen name="DetailView" component={DetailsScreen} />
    </ConnectStack.Navigator>
  );
};

export default React.memo(ConnectNavigator);
