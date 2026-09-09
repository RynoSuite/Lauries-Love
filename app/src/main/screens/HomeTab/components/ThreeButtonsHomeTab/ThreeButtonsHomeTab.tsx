import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';

// styles
import styles from './ThreeButtonsHomeTab.styles';
import colors from 'styles/colors';
import { LinearGradient } from 'expo-linear-gradient';

type ThreeButtonsHomeTabProps = {
  selectType: 'posts' | 'friends' | 'groups';
  setSelectType: (type: 'posts' | 'friends' | 'groups') => void;
};

const ThreeButtonsHomeTab: FunctionComponent<ThreeButtonsHomeTabProps> = ({
  selectType,
  setSelectType,
}) => {
  const [width, setWidth] = useState(169);
  const colorTextPosts = useRef(new Animated.Value(0)).current;
  const colorTextFriends = useRef(new Animated.Value(0)).current;
  const colorTextGroups = useRef(new Animated.Value(0)).current;
  const translateXLine = useRef(new Animated.Value(0)).current;

  const animatedSelectPosts = () => {
    Animated.parallel([
      Animated.timing(colorTextPosts, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(colorTextFriends, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(colorTextGroups, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(translateXLine, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animatedSelectFriends = () => {
    Animated.parallel([
      Animated.timing(colorTextPosts, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(colorTextFriends, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(colorTextGroups, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(translateXLine, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const animatedSelectGroups = () => {
    Animated.parallel([
      Animated.timing(colorTextPosts, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(colorTextFriends, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(colorTextGroups, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(translateXLine, {
        toValue: 2,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  useEffect(() => {
    if (selectType === 'posts') animatedSelectPosts();
    else if (selectType === 'friends') animatedSelectFriends();
    else animatedSelectGroups();
  }, [selectType]);

  return (
    <View style={styles.container}>
      <View
        style={styles.buttonsContainer}
        onLayout={event => {
          const { width } = event.nativeEvent.layout;
          setWidth((width - 20) / 3);
        }}
      >
        <TouchableOpacity
          onPress={() => setSelectType('posts')}
          style={styles.button}
        >
          <Animated.Text
            style={[
              styles.buttonText,
              {
                color: colorTextPosts.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.faint, colors.magentaText],
                }),
              },
            ]}
          >
            All posts
          </Animated.Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectType('friends')}
          style={styles.button}
        >
          <Animated.Text
            style={[
              styles.buttonText,
              {
                color: colorTextFriends.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.faint, colors.magentaText],
                }),
              },
            ]}
          >
            Friends
          </Animated.Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectType('groups')}
          style={styles.button}
        >
          <Animated.Text
            style={[
              styles.buttonText,
              {
                color: colorTextGroups.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.faint, colors.magentaText],
                }),
              },
            ]}
          >
            Groups
          </Animated.Text>
        </TouchableOpacity>
      </View>
      <View style={styles.lineContainer}>
        <Animated.View
          style={[
            styles.line,
            {
              width,
              transform: [
                {
                  translateX: translateXLine.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, width, width * 2 + 20],
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

export default React.memo(ThreeButtonsHomeTab);
