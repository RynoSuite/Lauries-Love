import React, { FunctionComponent, useState } from 'react';
import {
  TextInput,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
  ColorValue,
  TouchableOpacity,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

// types
import { IconType } from 'assets/icons-auto/icon.types';

// icons
import { IconClose, IconSearch } from 'assets/icons-auto/components';

// styles
import styles from './InputSearch.styles';
import colors from 'styles/colors';

type InputSearchProps = {
  search: string;
  setSearch: (value: string) => void;
  placeholder?: string;
  isBottomSheet?: boolean;
  styleContainer?: StyleProp<ViewStyle>;
  styleInput?: StyleProp<TextStyle>;
  iconProps?: IconType;
  placeholderTextColor?: ColorValue;
  isHideIcon?: boolean;
  onClear?: () => void;
  isDisabled?: boolean;
  multiline?: boolean;
};

const InputSearch: FunctionComponent<InputSearchProps> = ({
  search,
  setSearch,
  placeholder = 'Search country',
  isBottomSheet = false,
  styleContainer,
  styleInput,
  iconProps,
  // Defaulted rather than left undefined: an omitted value renders the
  // platform's own placeholder grey, which disappears against the dark input.
  placeholderTextColor = colors.faint,
  isHideIcon = false,
  onClear,
  isDisabled = false,
  multiline = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View
      style={[
        styles.container,
        onClear && styles.withClearContainer,
        isFocused && styles.containerFocus,
        styleContainer,
      ]}
    >
      {!isHideIcon && (
        <IconSearch
          width={24}
          height={24}
          stroke={colors.neutral[600]}
          strokeWidth={2}
          {...iconProps}
        />
      )}
      {isBottomSheet ? (
        <BottomSheetTextInput
          style={[styles.input, styleInput]}
          value={search}
          onChangeText={setSearch}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
        />
      ) : (
        <TextInput
          style={[styles.input, styleInput]}
          value={search}
          onChangeText={setSearch}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          editable={!isDisabled}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      )}
      {onClear && search.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearIcon}>
          <IconClose
            width={14}
            height={14}
            stroke={colors.neutral[800]}
            strokeWidth={2}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default InputSearch;
