import React from 'react';
import { ButtonGroupProps } from './group-button.model';
import styles from './group-button.styles';
import { Text, TouchableOpacity, View } from 'react-native';

export default function GroupButton<T>(props: ButtonGroupProps<T>) {
  const { options, currentValue, onChange } = props;
  const [selectedOption, setSelectedOption] = React.useState(currentValue);

  React.useEffect(() => {
    setSelectedOption(currentValue);
  }, [currentValue]);

  const handleOnChange = (value: T) => {
    setSelectedOption(value);
    onChange(value);
  };

  return (
    <View
      style={styles.container}
    >
      {options.map((option, idx) => (
        <TouchableOpacity
          key={`ButtonGroup-${option.label}-${idx}`}
          onPress={() => handleOnChange(option.value)}
          style={[styles.button, selectedOption === option.value && styles.selected]}
        >
          <Text
            style={[
              styles.text,
              selectedOption === option.value && styles.selectedText,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
