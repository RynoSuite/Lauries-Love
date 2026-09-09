import React, { FunctionComponent, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// styles
import styles from './VisibilitySelector.styles';
import colors from 'styles/colors';

type VisibilityType = 'public' | 'group';

type VisibilitySelectorProps = {
  visibility: VisibilityType;
  setVisibility: (value: VisibilityType) => void;
};

const VisibilitySelector: FunctionComponent<VisibilitySelectorProps> = ({
  visibility,
  setVisibility,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const widthRef = useRef(0);

  useEffect(() => {
    const toValue = visibility === 'public' ? 0 : 1;
    Animated.timing(translateX, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [visibility]);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    widthRef.current = (width - 20) / 2;
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonsContainer} onLayout={handleLayout}>
        <TouchableOpacity
          onPress={() => setVisibility('public')}
          style={styles.button}
        >
          <Text
            style={[
              styles.buttonText,
              visibility === 'public' && styles.buttonTextSelected,
            ]}
          >
            Public
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVisibility('group')}
          style={styles.button}
        >
          <Text
            style={[
              styles.buttonText,
              visibility === 'group' && styles.buttonTextSelected,
            ]}
          >
            My Groups
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lineContainer}>
        <Animated.View
          style={[
            styles.line,
            {
              width: widthRef.current,
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, widthRef.current + 20],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[colors.gilt, colors.gilt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradient}
          />
        </Animated.View>
      </View>
    </View>
  );
};

export default VisibilitySelector;
