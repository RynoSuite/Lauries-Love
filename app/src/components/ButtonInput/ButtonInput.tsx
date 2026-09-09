import React, { FunctionComponent } from 'react';
import { Pressable, Text } from 'react-native';

// types
import { IconType } from 'assets/icons-auto/icon.types';

// components
import { IconArrowDown } from 'assets/icons-auto/components';

// styles
import styles from './ButtonInput.styles';
import colors from 'styles/colors';

type ButtonInputProps = {
  value: string;
  /** Shown when there is no value yet, so an empty select still says what it selects. */
  placeholder?: string;
  IconRight?: (originalProps: IconType) => React.JSX.Element;
  isSelect?: boolean;
  onPress: () => void;
  disabled?: boolean;
};

const ButtonInput: FunctionComponent<ButtonInputProps> = ({
  value,
  placeholder,
  IconRight,
  isSelect = false,
  onPress,
  disabled = false,
}) => {
  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.container,
        {
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.value, !value && styles.placeholder]}>
        {value || placeholder}
      </Text>
      {IconRight ? (
        <IconRight width={24} height={24} />
      ) : isSelect ? (
        <IconArrowDown
          width={24}
          height={24}
          stroke={colors.muted}
          strokeWidth={2}
        />
      ) : null}
    </Pressable>
  );
};

// Memoized: rendered repeatedly in forms; props are simple values.
export default React.memo(ButtonInput);
