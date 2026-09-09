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
  /**
   * 'danger' for a destructive row — block, delete, leave. It carries its own
   * colour rather than each caller reaching for `styleLabel` and a transparent
   * container, which is how those rows drifted apart in the first place.
   */
  tone?: 'default' | 'danger';
};

/**
 * The settings row: an icon, a label, what it currently holds, and a chevron
 * into the sheet that changes it.
 *
 * Shared by the profile, the personal-information screen and the message
 * details screens, so its look is the look of every one of those lists. Any
 * change here is meant to land in all of them at once.
 */
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
  tone = 'default',
}) => {
  const danger = tone === 'danger';
  // "Not set" is the app's own word for an empty field, so the row can tell an
  // absence from a value without every caller having to say so.
  const isEmpty = value === 'Not set';

  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.container, disabled && styles.disabled, styleContainer]}
      onPress={onPress}
    >
      <View style={styles.part}>
        <View style={[styles.plate, danger && styles.plateDanger]}>
          <Icon
            width={18}
            height={18}
            stroke={danger ? colors.danger : colors.heading}
            strokeWidth={2}
            {...iconProps}
          />
        </View>
        <Text
          numberOfLines={1}
          style={[styles.label, danger && styles.labelDanger, styleLabel]}
        >
          {label}
        </Text>
      </View>
      <View style={[styles.part, styles.partRight]}>
        {value && (
          <View style={styles.valueContainer}>
            <Text
              numberOfLines={1}
              style={[styles.value, isEmpty && styles.valueEmpty]}
            >
              {value}
            </Text>
          </View>
        )}
        {isRightArrow && (
          <IconArrowRight
            width={18}
            height={18}
            // Quieter than the label: the chevron is an affordance, not
            // content, and at full heading white it competed with it.
            stroke={colors.muted}
            strokeWidth={2}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

// Memoized: rendered repeatedly in menu/settings lists; props are simple values.
export default React.memo(ButtonModalTabs);
