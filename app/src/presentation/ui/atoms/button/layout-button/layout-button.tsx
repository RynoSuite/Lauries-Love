import React from 'react';
import { LayoutButtonProps } from './layout-button.model';
import style from './layout-button.styles';
import { LinearGradient } from 'expo-linear-gradient';

import colors from 'styles/colors';
import { Text, TouchableOpacity, View } from 'react-native';

export default function LayoutButton<T>(props: LayoutButtonProps<T>) {
  const { options, setCurrentValue, currentValue } = props;
  const setValue = (value: T) => {
    return () => setCurrentValue?.(value);
  };

  const groupButtons = () => {
    const groupedButtons = [];
    let counter = 0;

    while (counter < options.length) {
      const option1 = options[counter];
      const option2 = options[counter + 1];
      // if there is only one option left, make it 3 buttons
      let option3;
      if (counter + 2 === options.length - 1) {
        option3 = options[counter + 2];
      }
      const buttonArray = [option1, option2, option3].filter(option => option);
      const buttons = (
        <View
          key={`layout-button-${option1.label}`}
          style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}
        >
          {buttonArray.map(option => {
            if (!option) return null;
            return (
              <LinearGradient
                colors={[colors.magenta, colors.magentaHi]}
                locations={[0, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={style.linearGradient}
                key={`layout-button-gradient-${option.label}`}
              >
                <TouchableOpacity
                  style={[
                    style.button,
                    currentValue === option.value && style.selected,
                  ]}
                  onPress={setValue(option.value)}
                >
                  <Text
                    style={[
                      style.text,
                      currentValue === option.value && style.selectedText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            );
          })}
        </View>
      );
      groupedButtons.push(buttons);
      counter += buttonArray.length;
    }

    return groupedButtons;
  };
  return <View>{groupButtons()}</View>;
}
