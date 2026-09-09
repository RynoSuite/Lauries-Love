import React, { FunctionComponent } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// icons
import { IconCheckbox } from 'assets/icons-auto/components';

// styles
import styles from './ButtonSelectProfileTab.styles';
import colors from 'styles/colors';

type ButtonSelectProfileTabProps = {
  title: string;
  onPress: () => void;
  isSelected: boolean;
  isCheckbox?: boolean;
};

const ButtonSelectProfileTab: FunctionComponent<
  ButtonSelectProfileTabProps
> = ({ title, onPress, isSelected, isCheckbox = false }) => (
  <LinearGradient
    colors={[colors.magenta, colors.magentaHi]}
    locations={[0, 0.8]}
    style={styles.universalContainer}
    start={{ x: 0, y: 0 }}
    end={{ x: 0, y: 1 }}
  >
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        isSelected && !isCheckbox && styles.selected,
        isCheckbox && styles.checkboxContainer,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {isCheckbox && (
        <View style={[styles.checkbox, isSelected && styles.selectCheckbox]}>
          {isSelected && <IconCheckbox width={14} height={14} />}
        </View>
      )}
    </Pressable>
  </LinearGradient>
);

export default ButtonSelectProfileTab;
