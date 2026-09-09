import React, { FunctionComponent } from 'react';
import {
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

// types
import { IconType } from 'assets/icons-auto/icon.types';

// icons
import { IconArrowRight } from 'assets/icons-auto/components';

// styles
import styles from './ButtonModalTabs.styles';
import colors from 'styles/colors';

type ButtonModalTabsProps = {
  Icon: (originalProps: IconType) => React.JSX.Element;
  label: string;
  value?: string;
  onPress: () => void;
  disabled?: boolean;
  styleContainer?: StyleProp<ViewStyle>;
  styleLabel?: StyleProp<TextStyle>;
  isRightArrow?: boolean;
  iconProps?: IconType;
};

const ButtonModalTabs: FunctionComponent<ButtonModalTabsProps> = ({
  Icon,
  label,
  value = null,
  onPress,
  disabled = false,
  styleContainer,
  styleLabel,
  isRightArrow = true,
  iconProps,
}) => (
  <TouchableOpacity
    disabled={disabled}
    style={[styles.container, styleContainer]}
    onPress={onPress}
  >
    <View style={styles.part}>
      <Icon
        width={20}
        height={20}
        stroke={colors.heading}
        strokeWidth={2}
        {...iconProps}
      />
      <Text style={[styles.label, styleLabel]}>{label}</Text>
    </View>
    <View style={[styles.part, styles.partRight]}>
      {value && (
        <View style={styles.valueContainer}>
          <Text numberOfLines={1} style={styles.value}>
            {value}
          </Text>
        </View>
      )}
      {isRightArrow && (
        <IconArrowRight
          width={20}
          height={20}
          stroke={colors.heading}
          strokeWidth={2}
        />
      )}
    </View>
  </TouchableOpacity>
);

// Memoized: rendered repeatedly in menu/settings lists; props are simple values.
export default React.memo(ButtonModalTabs);
