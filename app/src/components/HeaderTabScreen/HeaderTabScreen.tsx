import React, { FunctionComponent } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// styles
import styles from './HeaderTabScreen.styles';
import colors from 'styles/colors';

type HeaderTabScreenProps = {
  title?: string;
  onPressLeft?: () => void;
};

const HeaderTabScreen: FunctionComponent<HeaderTabScreenProps> = ({
  title,
  onPressLeft,
}) => (
  <View style={styles.container}>
    <TouchableOpacity onPress={onPressLeft} style={styles.button}>
      <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
    </TouchableOpacity>
    <Text style={styles.label}>{title}</Text>
    <TouchableOpacity
      disabled
      onPress={onPressLeft}
      style={[styles.button, styles.buttonHide]}
    >
      <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
    </TouchableOpacity>
  </View>
);

export default HeaderTabScreen;
