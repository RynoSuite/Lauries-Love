import React, { FunctionComponent } from 'react';
import { View, Text, TouchableOpacity, Share } from 'react-native';
import DonateHistory from '../DonateHistory/DonateHistory';
import { IconShare } from 'assets/icons-auto/components';
import styles from './HeaderBlock.styles';
import colors from 'styles/colors';

type HeaderBlockProps = {
  historyOpen?: boolean;
};

const HeaderBlock: FunctionComponent<HeaderBlockProps> = ({
  historyOpen = false,
}) => {
  const onPressShare = () => {
    Share.share({
      url: 'https://laurieslove.org/donate/',
      message: "Donate to Laurie's Love!",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titleHeader}>Donate</Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={onPressShare} style={styles.shareButton}>
            <IconShare
              width={24}
              height={24}
              stroke={colors.white}
              strokeWidth={2.1}
            />
          </TouchableOpacity>
          <DonateHistory historyOpen={historyOpen} />
        </View>
      </View>
    </View>
  );
};

export default HeaderBlock;
