import React, { FunctionComponent } from 'react';
import { Platform, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// styles
import styles from './BackgroundDonate.styles';
import colors from 'styles/colors';

type BackgroundDonateProps = {
  children: React.ReactNode;
};

const BackgroundDonate: FunctionComponent<BackgroundDonateProps> = ({
  children,
}) => {
  const { top } = useSafeAreaInsets();
  return (
    // The same ground the rest of the app stands on. This was a flat #F4F4F2,
    // so the donate section was an off-white island — and every piece of text
    // on it had already been moved to the dark palette, which is why it read
    // as near-white on near-white.
    <LinearGradient
      colors={[colors.ground, colors.surface, colors.deepwater]}
      locations={[0, 0.6, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.universalContainer,
        { paddingTop: Platform.OS === 'android' ? 16 : top },
      ]}
    >
      {children}
    </LinearGradient>
  );
};

export default BackgroundDonate;
