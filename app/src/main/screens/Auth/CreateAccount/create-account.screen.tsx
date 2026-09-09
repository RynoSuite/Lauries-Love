import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// providers
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';

// components
import Input from 'components/Input/Input';
import Button from 'components/Button/Button';
import Progress from 'components/Progress/Progress';
import { PhoneInput } from 'components/PhoneInput/PhoneInput';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// constants
import { REGEX_EMAIL } from 'constants/regexp';

// styles
import colors from 'styles/colors';
import { styles } from './create-account.styles';
import { ScrollView } from 'react-native-gesture-handler';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// hooks
import { useCountry, type Country } from 'presentation/hooks';

export default function CreateAccountScreen() {
  const navigation = useNavigation();
  const { checkCurrentUserAWS } = useUserAWSProvider();
  const { setUserOnboarding } = useUserDBProvider();
  const { defaultCountry, supportedCountries } = useCountry();

  const [account, setAccount] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [selectedCountry, setSelectedCountry] =
    useState<Country>(defaultCountry);
  const [errors, setErrors] = useState({ fullName: '', email: '', phone: '' });

  useFocusEffect(
    React.useCallback(() => {
      async function checkUserStatus() {
        const user = await checkCurrentUserAWS();

        if (user) {
          navigation.navigate('Authentication', {
            screen: 'YourAddress',
          });
        }
      }

      checkUserStatus();
    }, [checkCurrentUserAWS, navigation]),
  );

  function validateField(field: string) {
    let error = '';

    if (field === 'fullName') {
      error = account.fullName.trim() === '' ? 'Full name is required' : '';
    }

    if (field === 'email') {
      error = !REGEX_EMAIL.test(account.email)
        ? 'Invalid email address, e.g. yourname@example.com'
        : '';
    }

    if (field === 'phone') {
      const clearPhone = account.phone.replace(/\D/g, '');
      const format = selectedCountry?.format;
      if (format) {
        const expectedLength = (format.match(/X/g) || []).length;
        if (clearPhone.length !== expectedLength) {
          error = `Invalid phone number, e.g ${format.replaceAll('X', '5')}`;
        }
      } else {
        if (clearPhone.length < 6) {
          error = 'Invalid phone number';
        }
      }
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [field]: error,
    }));

    return error;
  }

  const handlePhoneChange = (phoneText: string, selectedCountry: Country) => {
    setErrors({ ...errors, phone: '' });
    setAccount({ ...account, phone: phoneText });
    setSelectedCountry(selectedCountry);
  };

  async function handleOnPress() {
    const errors = [
      validateField('fullName'),
      validateField('email'),
      validateField('phone'),
    ];
    if (errors.some(error => error)) return;

    setUserOnboarding({
      ...account,
      phone: account.phone.replace(/\D/g, ''),
      phoneLocation: selectedCountry.code,
    });

    navigation.navigate('Authentication', {
      screen: 'CreatePassword',
    });
  }

  const isDisabled = useMemo(() => {
    return (
      !account.fullName ||
      !account.email ||
      !account.phone ||
      !!errors.fullName ||
      !!errors.email ||
      !!errors.phone
    );
  }, [account, errors]);

  return (
    <LinearGradient
      colors={[colors.ground, colors.surface, colors.deepwater]}
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
                <Progress value={10} />
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 24 }}>
                <View style={{ gap: 8 }}>
                  <Text style={styles.title}>Create an Account</Text>
                  <Text style={styles.subtitle}>Tell us about you.</Text>
                </View>
                <View style={styles.formSection}>
                  <Input
                    value={account.fullName}
                    onChangeText={fullName => {
                      setErrors({ ...errors, fullName: '' });
                      setAccount({ ...account, fullName });
                    }}
                    placeholder="Full name*"
                    textContentType="name"
                    keyboardType="default"
                    errorMessage={errors.fullName}
                    onBlur={() => validateField('fullName')}
                    maxLength={24}
                  />
                  <Input
                    value={account.email}
                    onChangeText={email => {
                      setErrors({ ...errors, email: '' });
                      setAccount({ ...account, email });
                    }}
                    placeholder="Email address*"
                    autoCapitalize="none"
                    textContentType={'emailAddress'}
                    keyboardType={'email-address'}
                    errorMessage={errors.email}
                    onBlur={() => validateField('email')}
                    maxLength={40}
                  />
                  <PhoneInput
                    value={account.phone}
                    onChange={(phoneText: string, selectedCountry: any) => {
                      handlePhoneChange(phoneText, selectedCountry);
                    }}
                    countryList={supportedCountries}
                    defaultCountryCode={defaultCountry.code}
                    errorMessage={errors.phone}
                    onBlur={() => validateField('phone')}
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
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}
