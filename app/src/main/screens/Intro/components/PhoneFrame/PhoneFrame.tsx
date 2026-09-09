import React, { FunctionComponent, ReactNode } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { FROST, SHEEN } from '../glass';
import styles from './PhoneFrame.styles';

/**
 * The glass device the intro mockups live inside.
 *
 * Shared by every slide so they cannot drift apart in size, radius or
 * translucency. It is a semi-opaque panel: a frosted wash under a diagonal
 * sheen, edged with light along the top and left the way a pane is. No glow
 * and no shadow — the panel separates from the background by being lighter
 * than it, which is how glass actually reads.
 *
 * Nothing here animates. The frame is the surface the content sits on, and a
 * surface that moves competes with the content for attention — the movement on
 * these slides belongs to the posts, the map and the messages.
 */
const PhoneFrame: FunctionComponent<{ children: ReactNode }> = ({
  children,
}) => (
  <View style={styles.phone}>
    {/* The backdrop as the glass refracts it, then the light crossing the
        surface. Order matters: the wash sits under the sweep. */}
    <LinearGradient
      colors={FROST.colors}
      locations={FROST.locations}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.frost}
      pointerEvents="none"
    />
    <LinearGradient
      colors={SHEEN.colors}
      locations={SHEEN.locations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.sheen}
      pointerEvents="none"
    />
    {children}
  </View>
);

export default PhoneFrame;
