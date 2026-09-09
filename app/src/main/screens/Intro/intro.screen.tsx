import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import Button from 'components/Button/Button';

// Styles
import colors from 'styles/colors';
import styles from './intro.styles';

const CONTENT = [
  {
    image: require('assets/images/intro-welcome.png'),
    title: 'Welcome to Laurie’s Love',
    description:
      'Our mission is to connect, empower, and inspire every member who joins so that no warrior goes through their cancer journey alone.',
  },
  {
    image: require('assets/images/intro-support.png'),
    title: 'Find support near you',
    description:
      'Find comfort and connection near or far, on your terms. Use our interactive map to discover others on the same journey.',
  },
  {
    image: require('assets/images/intro-connect.png'),
    title: 'Connect, share and support',
    description:
      'Connect, share, and find support through our community. Learn how to help through donations.',
  },
];

const viewabilityConfig = {
  // Defines the percentage of the item's area that must be visible
  itemVisiblePercentThreshold: 50,
};

export default function IntroScreen() {
  const flatListRef = useRef<FlatList>(null);
  const navigation = useNavigation();

  const [currentIndex, setCurrentIndex] = useState(0);

  const { width } = Dimensions.get('window');

  function onViewableItemsChanged({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) {
    // Check if there are any items visible on the screen
    if (viewableItems.length > 0) {
      // Update the current index based on the first visible item
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }

  function handleLogIn() {
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('Authentication', {
        screen: 'login',
      });
    });
  }

  function handleSignUp() {
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('Authentication', {
        screen: 'CreateAccount',
      });
    });
  }

  function onPress() {
    if (currentIndex < CONTENT.length - 1) {
      // Scroll to the next item if not at the last one
      setCurrentIndex(currentIndex + 1);
      InteractionManager.runAfterInteractions(() => {
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      });
    } else {
      handleSignUp();
    }
  }

  return (
    <LinearGradient
      colors={[colors.ground, colors.surface, colors.deepwater]}
      locations={[0, 0.6, 1]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('assets/images/lauries-love.png')}
            style={{ width: 180, height: 180, resizeMode: 'contain' }}
          />
        </View>
        <View style={{ gap: 24 }}>
          <View style={styles.flatListContainer}>
            <FlatList
              ref={flatListRef}
              data={CONTENT}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={[styles.imageWrapper, { width }]}>
                  <Image source={item.image} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.titleText}>{item.title}</Text>
                    <Text style={styles.descriptionText}>
                      {item.description}
                    </Text>
                  </View>
                </View>
              )}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
            />
          </View>
          <View style={styles.paginationContainer}>
            {CONTENT.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor:
                      currentIndex === index ? colors.primary[500] : '#D9D9D9',
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.buttonWrapper}>
            <View style={styles.buttonContainer}>
              <Button
                title={currentIndex < 2 ? 'Next' : 'Get started'}
                onPress={onPress}
              />
            </View>
            <View style={styles.loginTextContainer}>
              <Text style={styles.accountText}>Have an account?</Text>
              <TouchableOpacity onPress={handleLogIn}>
                <Text style={styles.loginLinkText}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
