import React, { FunctionComponent, useMemo } from 'react';
import { Image, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Space between the status bar and the first thing on a screen. One constant,
// applied by every screen through this component.
const SCREEN_TOP_GAP = 30;

// types
import { LinearGradientBackgroundScreenType } from './BackgroundScreen.types';

// images
import BackgroundProfileQr from 'assets/images/background-profile-QR.png';

// styles
import colors from 'styles/colors';
import styles from './BackgroundScreen.styles';

type BackgroundScreenProps = {
  children: React.ReactNode;
  type?:
    | 'profile'
    | 'updateProfile'
    | 'profile-QR'
    | 'messages'
    | 'friendBlock'
    | 'home-main'
    | 'home-create-post'
    | 'home-post'
    | 'messages-tab-profile'
    | 'messagesDetails';
};

const BackgroundScreen: FunctionComponent<BackgroundScreenProps> = ({
  children,
  type = 'profile',
}) => {
  const { top } = useSafeAreaInsets();
  // Added to the safe-area inset rather than replacing it: the inset is what
  // clears the notch and varies by device, this is the design breathing room.
  const topPad = top + SCREEN_TOP_GAP;
  const config: LinearGradientBackgroundScreenType = useMemo(() => {
    if (type === 'updateProfile')
      return {
        colors: [
          colors.ground,
          colors.surface,
          colors.deepwater,
        ],
        locations: [0.1, 0.5, 1],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 1.4 },
      };
    if (type === 'messages')
      return {
        colors: [colors.ground, colors.ground, colors.surface],
        locations: [0.1, 0.5, 1],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 1.4 },
      };
    if (type === 'messagesDetails')
      return {
        colors: [colors.ground, colors.ground, colors.surface],
        locations: [0.1, 0.55, 0.8],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 1.4 },
      };
    if (type === 'friendBlock')
      return {
        colors: [
          colors.ground,
          colors.surface,
          colors.ground,
          colors.deepwater,
        ],
        locations: [0.1, 0.5, 0.7, 0.9],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 1.4 },
      };
    if (type === 'home-main')
      return {
        colors: [colors.ground, colors.ground, colors.deepwater],
        locations: [0.1, 0.5, 1],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 1.4 },
      };
    if (type === 'home-create-post')
      return {
        colors: [colors.ground, colors.surface, colors.deepwater],
        locations: [0.2, 0.5, 1],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 1.4 },
      };
    if (type === 'home-post')
      return {
        colors: [
          colors.ground,
          colors.surface,
          colors.deepwater,
        ],
        locations: [0.2, 0.4, 0.8],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 1.4 },
      };
    if (type === 'messages-tab-profile')
      return {
        colors: [colors.ground, colors.surface, colors.deepwater],
        locations: [0.2, 1, 0.1],
        start: { x: 0, y: -0.5 },
        end: { x: 0, y: 0.5 },
      };
    return {
      colors: [
        colors.ground,
        colors.ground,
        colors.surface,
      ],
      locations: [0, 0.8, 1],
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
    };
  }, [type]);

  if (type === 'profile-QR')
    return (
      <View
        style={[
          styles.universalContainer,
          {
            paddingTop: topPad,
          },
        ]}
      >
        <Image source={BackgroundProfileQr} style={styles.image} />
        {children}
      </View>
    );

  if (type === 'home-post')
    return (
      <View
        style={[
          styles.universalContainer,
          {
            backgroundColor: colors.ground,
            paddingTop: topPad,
          },
        ]}
      >
        {children}
      </View>
    );

  if (type === 'home-create-post')
    return (
      <View
        style={[
          styles.universalContainer,
          {
            backgroundColor: colors.ground,
            paddingTop: topPad,
          },
        ]}
      >
        {children}
      </View>
    );

  return (
    <LinearGradient
      colors={config.colors}
      locations={config.locations}
      style={[
        styles.universalContainer,
        type === 'messages' && { paddingBottom: 0 },
      ]}
      start={config.start}
      end={config.end}
    >
      <View
        style={[
          styles.universalContainer,
          {
            paddingTop: topPad,
          },
          type === 'messages' && { paddingBottom: 0 },
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
};

export default BackgroundScreen;
