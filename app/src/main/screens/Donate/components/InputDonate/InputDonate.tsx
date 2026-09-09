import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  TouchableOpacity,
} from 'react-native';
import MaskInput from 'react-native-mask-input';

// icons
import { IconEyeOff } from 'assets/icons-auto/components';

// styles
import styles from './InputDonate.styles';
import colors from 'styles/colors';
import { InputProps } from 'components/Input/Input';

type DonateInputProps = {
  label: string;
  required?: boolean;
  valid?: boolean;
}

const InputDonate: FunctionComponent<InputProps & DonateInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  errorMessage,
  textContentType,
  keyboardType,
  onBlur,
  autoCapitalize = 'sentences',
  mask,
  onPressRight,
  IconRight,
  required,
}) => {
  const [height, setHeight] = useState(0);
  const [isOnFocus, setIsOnFocus] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: errorMessage && height ? height : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [errorMessage, height]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text>*</Text>}
      </Text>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: errorMessage
              ? colors.error[400]
              : isOnFocus
              ? colors.primary[300]
              : 'transparent',
          },
        ]}
      >
        {mask ? (
          <MaskInput
            mask={mask}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            style={styles.input}
            textContentType={textContentType}
            keyboardType={keyboardType}
            placeholderTextColor={colors.faint}
            autoCapitalize={autoCapitalize}
            onFocus={() => setIsOnFocus(true)}
            onBlur={() => {
              setIsOnFocus(false);
              if (onBlur) onBlur();
            }}
          />
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            style={styles.input}
            textContentType={textContentType}
            keyboardType={keyboardType}
            placeholderTextColor={colors.faint}
            autoCapitalize={autoCapitalize}
            onFocus={() => setIsOnFocus(true)}
            onBlur={() => {
              setIsOnFocus(false);
              if (onBlur) onBlur();
            }}
          />
        )}
        {onPressRight && (
          <TouchableOpacity onPress={onPressRight} style={styles.buttonRight}>
            {IconRight ? (
              <IconRight width={24} height={24} />
            ) : (
              <IconEyeOff width={24} height={24} />
            )}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.containerError}>
        <Animated.View style={{ height: animatedHeight }}>
          <Text style={styles.error}>{errorMessage}</Text>
        </Animated.View>
        <Text
          onLayout={layout => setHeight(layout.nativeEvent.layout.height)}
          style={[styles.error, styles.errorHide]}
        >
          {errorMessage}
        </Text>
      </View>
    </View>
  );
};

export default InputDonate;
