import React, { FunctionComponent, useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// types
import { LinearGradientBackgroundScreenType } from 'components/BackgroundScreen/BackgroundScreen.types';

// styles
import styles from './LoadingLine.styles';
import colors from 'styles/colors';

const WIDTH = Dimensions.get('window').width;

const LoadingLine: FunctionComponent = () => {
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config: LinearGradientBackgroundScreenType = useMemo(
    () => ({
      colors: [colors.magenta, colors.magentaText],
      locations: [0, 1],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    }),
    [],
  );

  const animateStart = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: WIDTH,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  };

  useEffect(() => {
    animateStart();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.line,
          {
            transform: [
              {
                translateX,
              },
            ],
            opacity,
          },
        ]}
      >
        <LinearGradient
          colors={config.colors}
          locations={config.locations}
          style={styles.gradient}
          start={config.start}
          end={config.end}
        />
      </Animated.View>
    </View>
  );
};

// Memoized: no props — parent re-renders should never restart/re-render it.
export default React.memo(LoadingLine);
