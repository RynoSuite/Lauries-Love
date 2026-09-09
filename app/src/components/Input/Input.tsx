import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Animated,
  KeyboardTypeOptions,
  TouchableOpacity,
} from 'react-native';
import MaskInput, { Mask } from 'react-native-mask-input';

// icons
import { IconEyeOff, IconEyeOn } from 'assets/icons-auto/components';
import { IconType } from 'assets/icons-auto/icon.types';

// styles
import styles from './Input.styles';
import colors from 'styles/colors';

export type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  isPassword?: boolean;
  errorMessage?: string | null;
  textContentType?:
    | 'emailAddress'
    | 'password'
    | 'name'
    | 'telephoneNumber'
    | 'countryName'
    | 'addressCity'
    | 'postalCode'
    | 'none'
    | 'creditCardNumber';
  keyboardType?: KeyboardTypeOptions;
  onBlur?: () => void;
  autoCapitalize?: 'sentences' | 'none' | 'words' | 'characters';
  mask?: Mask;
  maxLength?: number;
};

const Input: FunctionComponent<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  isPassword = false,
  errorMessage,
  textContentType,
  keyboardType,
  onBlur,
  autoCapitalize = 'sentences',
  mask,
  maxLength,
}) => {
  const [height, setHeight] = useState(0);
  const [isOnFocus, setIsOnFocus] = useState(false);
  const [isSecureTextEntry, setIsSecureTextEntry] = useState(true);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: errorMessage && height ? height : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [errorMessage, height]);

  return (
    <View>
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
            secureTextEntry={isPassword && isSecureTextEntry}
            placeholderTextColor={colors.faint}
            autoCapitalize={autoCapitalize}
            onFocus={() => setIsOnFocus(true)}
            onBlur={() => {
              setIsOnFocus(false);
              if (onBlur) onBlur();
            }}
            maxLength={maxLength}
          />
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            style={styles.input}
            textContentType={textContentType}
            keyboardType={keyboardType}
            secureTextEntry={isPassword && isSecureTextEntry}
            placeholderTextColor={colors.faint}
            autoCapitalize={autoCapitalize}
            onFocus={() => setIsOnFocus(true)}
            onBlur={() => {
              setIsOnFocus(false);
              if (onBlur) onBlur();
            }}
            maxLength={maxLength}
          />
        )}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecureTextEntry(!isSecureTextEntry)}
            style={styles.passwordIcon}
          >
            {isSecureTextEntry ? (
              <IconEyeOn width={24} height={24} />
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

// Memoized: skips re-render when the parent form re-renders for other fields.
export default React.memo(Input);
