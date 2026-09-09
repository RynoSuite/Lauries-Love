import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';

// components
import MaskInput from 'react-native-mask-input';
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';
import Searchbar from 'components/Searchbar/Searchbar';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// styles
import styles from './PhoneInput.styles';
import colors from 'styles/colors';

const HEIGH = Dimensions.get('window').height;

type Country = {
  name: string;
  code: string;
  prefix: string;
  format?: string | null;
};

type PhoneInputProps = {
  value: string;
  onChange: (text: string, selectedCountry: Country) => void;
  countryList: Country[];
  defaultCountryCode?: string;
  errorMessage?: string;
  onBlur?: () => void;
};

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  countryList,
  defaultCountryCode = 'US',
  errorMessage,
  onBlur,
}) => {
  const [height, setHeight] = useState(0);
  const [isOnFocus, setIsOnFocus] = useState(false);
  const [query, setQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: errorMessage && height ? height : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [errorMessage, height]);

  const filteredCountries = useMemo(() => {
    const q = query.toLowerCase();
    return countryList.filter(country =>
      country.name.toLowerCase().includes(q),
    );
  }, [countryList, query]);

  useEffect(() => {
    const defaultCountry =
      countryList.find(c => c.code === defaultCountryCode) || countryList[0];
    setSelectedCountry(defaultCountry);
  }, [defaultCountryCode, countryList]);

  const handleCountry = (country: Country) => {
    setSelectedCountry(country);
    onChange('', country);
    setModalVisible(false);
  };

  const formatToMask = (format?: string | null) => {
    if (!format) return [/\d/]; // fallback: only number

    return format.split('').map(char => {
      if (char === 'X') return /\d/;
      return char;
    });
  };

  const handleChangeText = (masked: string) => {
    onChange?.(masked, selectedCountry!);
  };

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
        {/* phone prefix button */}
        <TouchableOpacity
          style={[
            styles.prefixButton,
            {
              borderColor: errorMessage
                ? colors.error[400]
                : isOnFocus
                ? colors.primary[300]
                : colors.neutral[500],
            },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.prefixText}>+{selectedCountry?.prefix}</Text>
        </TouchableOpacity>

        {/* phone number input */}
        <MaskInput
          mask={formatToMask(selectedCountry?.format)}
          value={value}
          onChangeText={handleChangeText}
          placeholder="Phone number"
          style={styles.input}
          textContentType="telephoneNumber"
          keyboardType="phone-pad"
          secureTextEntry={false}
          placeholderTextColor={colors.neutral[600]}
          autoCapitalize="sentences"
          onFocus={() => setIsOnFocus(true)}
          onBlur={() => {
            setIsOnFocus(false);
            if (onBlur) onBlur();
          }}
          maxLength={24}
        />

        {/* prefix modal */}
        {modalVisible && (
          <BottomSheetCustom
            onClose={() => setModalVisible(false)}
            snapPoints={[HEIGH * 0.4]}
          >
            <View style={styles.modalContainer}>
              <View style={styles.headerModal}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.titleTextModal}>
                  Select country or region
                </Text>
              </View>
              <Searchbar
                placeholder="Search"
                value={query}
                onChangeText={setQuery}
              />
              <ScrollView contentContainerStyle={styles.listContainer}>
                {filteredCountries.map(country => (
                  <TouchableOpacity
                    key={country.code}
                    onPress={() => handleCountry(country)}
                  >
                    <Text style={styles.modalText}>
                      {country.name} (+{country.prefix})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </BottomSheetCustom>
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
