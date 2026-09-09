import React, { FunctionComponent, useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

import colors from 'styles/colors';

type BrandedLoaderProps = {
  /** Bar fills smoothly while mounted; parent unmounts it when ready. */
  message?: string;
};

/**
 * Branded loading screen: Laurie's Love logo + progress bar.
 * The bar eases toward ~90% while work is in flight (perceived progress) —
 * the parent unmounts this component the moment real data is ready.
 */
const BrandedLoader: FunctionComponent<BrandedLoaderProps> = () => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fast start, gentle finish: 0 -> 60% quickly, then crawl to 90%.
    Animated.sequence([
      Animated.timing(progress, {
        toValue: 0.6,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(progress, {
        toValue: 0.9,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo-large.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    backgroundColor: colors.ground,
  },
  logo: {
    width: 160,
    height: 160,
  },
  barTrack: {
    width: 180,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.magenta,
  },
});

export default BrandedLoader;
