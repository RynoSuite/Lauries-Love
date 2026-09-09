import React, { FunctionComponent, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoPlayer from 'react-native-media-console';
import { useIsFocused } from '@react-navigation/native';

// types
import { RootHomeTabParamList } from 'main/navigators/HomeTabStacks/HomeTabStacks.types';

// constants
import { KEY_SAW_FULL_TARA_STORY } from '../HomeTab.constants';

// icons
import {
  IconArrowLeft,
  IconClock,
  IconClose,
  IconPlay,
} from 'assets/icons-auto/components';

// assets
import imageTara from 'assets/images/tara-post-image-2.png';

// constants
import { DEFAULT_TARA_HISTORY } from './HomeTabTaraDetails.constants';

// styles
import styles from './HomeTabTaraDetails.styles';
import colors from 'styles/colors';

type HomeTabTaraDetailsProps = {
  navigation: NativeStackNavigationProp<RootHomeTabParamList>;
};

const DEFAULT_VIDEO_TARA =
  'https://lauries-love-video.s3.amazonaws.com/lauries.mp4';

const HomeTabTaraDetails: FunctionComponent<HomeTabTaraDetailsProps> = ({
  navigation,
}) => {
  const isFocused = useIsFocused();
  const { top, bottom } = useSafeAreaInsets();
  const [showVideo, setShowVideo] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handlePause = () => {
    setIsPaused(true);
  };

  const handlePlay = () => {
    setIsPaused(false);
  };

  const setStorage = async () => {
    await AsyncStorage.setItem(KEY_SAW_FULL_TARA_STORY, JSON.stringify(true));
  };

  useEffect(() => {
    setStorage();
  }, []);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: top,
            paddingBottom: bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            disabled
            style={[styles.backButton, styles.backButtonHide]}
          >
            <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => setShowVideo(true)}
          >
            <Image source={imageTara} style={styles.image} />
            <View style={styles.imageOverlay}>
              <Text style={styles.title}>
                Tara's Inspiring Story how it started
              </Text>
              <View style={styles.bottomBar}>
                <View style={styles.bottomBarLeft}>
                  <IconClock
                    width={13}
                    height={13}
                    stroke={colors.heading}
                    strokeWidth={3}
                  />
                  <Text style={styles.bottomBarText}>3 min</Text>
                </View>
                <View style={styles.bottomBarRight}>
                  <IconPlay width={17} height={17} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainerStyle}
          >
            {DEFAULT_TARA_HISTORY.map((item, index) => (
              <View key={`${item.title}-${index}`} style={styles.historyItem}>
                <Text style={styles.historyItemTitle}>{item.title}</Text>
                <Text style={styles.historyItemContent}>{item.content}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
      {showVideo && (
        <View style={styles.showVideoContainer}>
          <VideoPlayer
            ignoreSilentSwitch="ignore"
            source={{
              uri: DEFAULT_VIDEO_TARA,
              shouldCache: true,
            }}
            seekColor={colors.primary['400']}
            showOnStart
            showDuration
            showTimeRemaining
            disableBack
            disableVolume
            paused={!isFocused || isPaused}
            containerStyle={styles.videoContainer}
            videoStyle={styles.videoStyle}
            onPause={handlePause}
            onPlay={handlePlay}
            fullscreen={isFullScreen}
            onEnterFullscreen={() => setIsFullScreen(val => !val)}
            resizeMode="contain"
          />
          <TouchableOpacity
            onPress={() => setShowVideo(false)}
            style={styles.closeButton}
          >
            <IconClose width={30} height={30} stroke={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

export default HomeTabTaraDetails;
