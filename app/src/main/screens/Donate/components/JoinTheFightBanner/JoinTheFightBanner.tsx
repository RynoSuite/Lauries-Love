import React from 'react';

import { Text, TouchableOpacity, View } from 'react-native';
import styles from './JoinTheFightBanner.styles';
import { Image } from 'react-native';
import { IconArrowRight } from 'assets/icons-auto/components';
import colors from 'styles/colors';
import { useNavigation } from '@react-navigation/native';
import { PATHS_DONATE_TAB } from 'main/navigators/paths';

export default function JoinTheFight() {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('Donate', {
      screen: PATHS_DONATE_TAB.donateTabJoinTheFight,
    });
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('assets/images/join-the-fight-banner.png')}
        style={styles.image}
      />
      <View style={styles.textContainer}>
        <View>
          <Text style={styles.title}>Join the Fight:</Text>
          <Text style={styles.title}>Support Laurie’s Love</Text>
        </View>
        <TouchableOpacity style={styles.linkButton} onPress={handlePress}>
          <Text style={styles.linkButtonText}>Learn more</Text>
          <IconArrowRight
            style={styles.linkButtonIcon}
            width={18}
            height={18}
            stroke={colors.heading}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
