import React, { useState } from 'react';
import {
  Dimensions,
  Keyboard,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// providers
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// hooks
import useAuth from '../useAuth';
import { getLocationCity } from 'utils/geolocation';

// components
import Input from 'components/Input/Input';
import BottomSheetCustom from 'components/BottomSheetCustom/BottomSheetCustom';
import Button from 'components/Button/Button';
import Progress from 'components/Progress/Progress';
import Searchbar from 'components/Searchbar/Searchbar';

// icons
import { IconArrowLeft, IconChevronDown } from 'assets/icons-auto/components';

// hooks
import { useCountry } from 'presentation/hooks';

// styles
import colors from 'styles/colors';
import { styles } from './your-address.styles';
import { isValidZipcode } from 'utils/zipcode-validation';

const HEIGH = Dimensions.get('window').height;

export default function YourAddressScreen() {
  const { updateUserDB } = useUserDBProvider();
  const { onPressBack } = useAuth(true);
  const navigation = useNavigation();
  const { supportedCountries, defaultCountry } = useCountry();

  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [address, setAddress] = useState({
    country: defaultCountry.code,
    city: '',
    zipCode: '',
    location: { latitude: 0, longitude: 0 },
  });
  const [errors, setErrors] = useState({
    country: '',
    city: '',
    zipCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  function validateField(field: string) {
    let error = '';

    if (field === 'country') {
      error = address.country.trim() === '' ? 'Country is required' : '';
    }

    if (field === 'city') {
      if (address.city.trim() === '') {
        error = 'City is required';
      } else if (!/^[A-Za-z\s]+$/.test(address.city)) {
        error = 'City must contain only letters';
      }
    }

    if (field === 'zipCode') {
      const zip = address.zipCode.trim();
      // we just valid zip code for us and ca at present
      if (!zip) {
        error = 'Zip Code is required';
      } else {
        const isValidZip = isValidZipcode(zip, address.country);
        if (!isValidZip) {
          if (address.country === 'CA') {
            error = 'Invalid Canadian postal code, e.g. A1A 1A1';
          } else if (address.country === 'US') {
            error = 'Invalid US ZIP Code, e.g. 12345 or 12345-6789';
          } else {
            error = 'Invalid ZIP Code';
          }
        }
      }
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [field]: error,
    }));
  }

  async function handleOnPress() {
    setIsLoading(true);
    try {
      const geoLocation = await getLocationCity(address.city, address.country);

      await updateUserDB({
        ...address,
        city: address.city.trim(),
        zipCode: address.zipCode.trim(),
        geoLocation,
      });

      navigation.navigate('Authentication', {
        screen: 'UserType',
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to update user address', error);
    } finally {
      setIsLoading(false);
    }
  }

  const isDisabled =
    !address.country ||
    !address.city ||
    !address.zipCode ||
    !!errors.city ||
    !!errors.zipCode ||
    isLoading;

  const filteredCountries = supportedCountries.filter(country =>
    country.name.toLowerCase().includes(query.toLowerCase()),
  );

  const selectedCountry = supportedCountries.find(
    country => country.code === address.country,
  )?.name;

  function handleCountry(newCountry: string) {
    if (newCountry !== address.country) {
      setAddress({ ...address, country: newCountry, city: '', zipCode: '' });
    }
    setIsModalOpen(false);
  }

  return (
    <LinearGradient
      colors={[
        'rgba(255, 227, 195, 0.70)',
        colors.neutral[100],
        colors.secondary[300],
      ]}
      locations={[0, 0.4, 1]}
      style={styles.linearGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={styles.contentContainer}>
              <View style={styles.topSection}>
                <Progress value={40} />
                <TouchableOpacity
                  onPress={onPressBack}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <IconArrowLeft
                    width={30}
                    height={30}
                    stroke={colors.neutral[1000]}
                  />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 24 }}>
                <View style={{ gap: 8 }}>
                  <Text style={styles.title}>What’s your Address?</Text>
                  <Text style={styles.subtitle}>
                    We need this information to find users and support near you.
                  </Text>
                </View>
                <View style={styles.formSection}>
                  <TouchableOpacity
                    onPress={() => setIsModalOpen(true)}
                    style={[styles.countrySelector]}
                  >
                    <Text
                      style={[
                        styles.countryText,
                        {
                          color: address.country
                            ? colors.neutral[1000]
                            : colors.neutral[600],
                        },
                      ]}
                    >
                      {address.country ? selectedCountry : 'Country*'}
                    </Text>
                    <IconChevronDown
                      width={24}
                      height={24}
                      stroke={colors.muted}
                    />
                  </TouchableOpacity>
                  <Input
                    value={address.city}
                    onChangeText={city => setAddress({ ...address, city })}
                    placeholder="City*"
                    textContentType="addressCity"
                    keyboardType="default"
                    errorMessage={errors.city}
                    onBlur={() => validateField('city')}
                    maxLength={24}
                  />
                  <Input
                    value={address.zipCode}
                    onChangeText={zipCode =>
                      setAddress({ ...address, zipCode })
                    }
                    placeholder="Zip code*"
                    textContentType="postalCode"
                    keyboardType="default"
                    errorMessage={errors.zipCode}
                    onBlur={() => validateField('zipCode')}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="Continue"
                onPress={handleOnPress}
                disabled={isDisabled}
              />
            </View>
          </ScrollView>
          {isModalOpen && (
            <BottomSheetCustom
              onClose={() => setIsModalOpen(false)}
              snapPoints={[HEIGH * 0.4]}
            >
              <View style={styles.modalContainer}>
                <View style={styles.headerModal}>
                  <TouchableOpacity onPress={() => setIsModalOpen(false)}>
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
                      onPress={() => handleCountry(country.code)}
                    >
                      <Text style={styles.modalText}>{country.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </BottomSheetCustom>
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}
