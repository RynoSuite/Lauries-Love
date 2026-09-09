import React, { Dispatch } from 'react';
import { Keyboard, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

// icons
import { IconMagnifyingGlass, IconXMark } from 'assets/icons-auto/components';

// styles
import colors from 'styles/colors';
import styles from './Searchbar.styles';

type Props = {
  value: string;
  placeholder: string;
  onChangeText: Dispatch<string>;
  onSubmit?: (query: string) => void;
  isBottomSheet?: boolean;
};

export default function Searchbar({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  isBottomSheet = false,
}: Props) {
  function handleSearch() {
    if (value.trim()) {
      if (onSubmit) onSubmit(value.trim());
      Keyboard.dismiss();
    }
  }

  function handleClear() {
    onChangeText('');
    Keyboard.dismiss();
  }

  return (
    <View style={styles.container}>
      <IconMagnifyingGlass width={20} height={20} color={colors.neutral[700]} />
      {isBottomSheet ? (
        <BottomSheetTextInput
          placeholder={placeholder}
          style={styles.input}
          value={value}
          onChangeText={text => onChangeText(text)}
          onSubmitEditing={handleSearch}
          placeholderTextColor={colors.faint}
        />
      ) : (
        <TextInput
          placeholder={placeholder}
          style={styles.input}
          value={value}
          onSubmitEditing={handleSearch}
          onChangeText={text => onChangeText(text)}
          placeholderTextColor={colors.faint}
        />
      )}

      {value && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <IconXMark width={16} height={16} color={colors.neutral[800]} />
        </TouchableOpacity>
      )}
    </View>
  );
}
