import { MOCK_ENABLED } from 'mocks/mock.config';
import { MOCK_AUTH_USER } from 'mocks/mock.auth';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import useAuth from '../useAuth';
import colors from 'styles/colors';
import Input from 'components/Input/Input';
import Button from 'components/Button/Button';
import { styles } from './diagnosed-year.styles';
import Progress from 'components/Progress/Progress';
import { useDBProvider } from 'providers/DBProvider/DBProvider';
import { IconArrowLeft, IconCheckbox } from 'assets/icons-auto/components';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';

export default function DiagnosedYearScreen() {
  const { userDB, updateUserDB } = useUserDBProvider();
  const { userAWS } = useUserAWSProvider();
  const {
    db: { designationTypes },
  } = useDBProvider();
  const { onPressBack } = useAuth();
  const navigation = useNavigation();
  const [diagnosedYear, setDiagnosedYear] = useState('');
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  // Non-patient roles: "Have you been diagnosed?" — null until answered.
  const [hasBeenDiagnosed, setHasBeenDiagnosed] = useState<boolean | null>(
    null,
  );

  const isFriend = useMemo(() => {
    // Rebuild fix (logic): only patients/survivors have a personal diagnosis
    // year. This bypass previously applied ONLY to the "Friend" role —
    // caregivers, family members, and supporters were still forced to enter
    // a year that doesn't exist for them. Now ANY non-patient role gets the
    // terms-only version of this screen (the year field is hidden).
    const selectRole = userDB
      ? designationTypes.find(item => {
          const roleId =
            typeof userDB.role === 'string'
              ? userDB.role
              : userDB.role?.id || null;
          if (!roleId) return false;
          return item.id === roleId;
        }) || null
      : null;

    if (!selectRole?.description) return false; // unknown role -> ask (old behavior)

    const roleName = selectRole.description.toLowerCase();
    const hasOwnDiagnosis =
      roleName.includes('warrior') ||
      roleName.includes('patient') ||
      roleName.includes('survivor');

    return !hasOwnDiagnosis;
  }, [userDB, designationTypes]);

  // Year field applies to patients/survivors always, and to non-patient
  // roles only when they answer YES to "Have you been diagnosed?".
  const showYearField = !isFriend || hasBeenDiagnosed === true;

  const isDisabled = useMemo(
    () =>
      (isFriend && hasBeenDiagnosed === null) || // must answer the question
      (showYearField && !diagnosedYear) ||
      !termsAccepted ||
      !privacyAccepted ||
      (showYearField && !!error) ||
      loading,
    [
      isFriend,
      hasBeenDiagnosed,
      showYearField,
      diagnosedYear,
      termsAccepted,
      privacyAccepted,
      error,
      loading,
    ],
  );

  useEffect(() => {
    if (diagnosedYear) {
      const handler = setTimeout(() => {
        validateField();
      }, 500);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [diagnosedYear]);

  function validateField() {
    let error = '';

    if (diagnosedYear.trim() === '') {
      error = 'Year is required';
    } else {
      const currentYear = new Date().getFullYear();
      const minYear = currentYear - 80;
      const enteredYear = parseInt(diagnosedYear);

      if (enteredYear > currentYear) {
        error = 'The year cannot be in the future';
      } else if (enteredYear < minYear) {
        error = 'Invalid year';
      }
    }

    setError(error);

    return error;
  }

  const handleOnPress = async () => {
    try {
      setLoading(true);
      const error = showYearField ? validateField() : '';
      if (error && showYearField) return;

      // Rebuild fix: read the id from the auth provider instead of a direct
      // Cognito call — works identically in mock and Supabase modes. The
      // legacy getCurrentUser() fallback is gone with aws-amplify.
      const userId = userAWS?.userId ?? (MOCK_ENABLED ? MOCK_AUTH_USER.userId : '');
      await updateUserDB({
        cognitoId: userId,
        lastName: null,
        diagnosisYear: diagnosedYear,
        profilePicture: null,
        config: {
          notifications: {
            active: false,
            notificationToken: '',
            deviceType: Platform.OS,
          },
        },
      });

    } catch (error) {
      if (__DEV__) console.warn('Failed to update user', error);
    } finally {
      setLoading(false);
      navigation.navigate('Authentication', {
        screen: 'RecommendedGroups',
      });
    }
  };

  const onPressPrivacyTerms = (isPrivacy: boolean) => {
    const linkPrivacy = 'https://laurieslove.org/privacy-policy/';
    const linkTerms = 'https://laurieslove.org/terms-of-use/';
    Linking.openURL(isPrivacy ? linkPrivacy : linkTerms);
  };

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
            <View style={styles.scrollContainer}>
              <View style={styles.contentContainer}>
                <View style={styles.topSection}>
                  <Progress value={90} />
                  <TouchableOpacity
                    onPress={onPressBack}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
                <View style={{ gap: 24 }}>
                  <View style={{ gap: 8 }}>
                    <Text style={styles.title}>
                      {isFriend ? 'Have you been diagnosed?' : 'Diagnosed Year'}
                    </Text>
                  </View>
                  {isFriend && (
                    <View style={styles.diagnosedButtonRow}>
                      <TouchableOpacity
                        style={[
                          styles.diagnosedButton,
                          hasBeenDiagnosed === true &&
                            styles.diagnosedButtonSelected,
                        ]}
                        onPress={() => setHasBeenDiagnosed(true)}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: hasBeenDiagnosed === true,
                        }}
                      >
                        <Text style={styles.diagnosedButtonText}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.diagnosedButton,
                          hasBeenDiagnosed === false &&
                            styles.diagnosedButtonSelected,
                        ]}
                        onPress={() => {
                          setHasBeenDiagnosed(false);
                          setDiagnosedYear('');
                          setError('');
                        }}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: hasBeenDiagnosed === false,
                        }}
                      >
                        <Text style={styles.diagnosedButtonText}>No</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {showYearField && (
                    <View style={styles.mainSection}>
                      <Input
                        value={diagnosedYear}
                        onChangeText={text => {
                          const numericValue = text.replace(/[^0-9]/g, '');
                          setDiagnosedYear(numericValue);
                        }}
                        placeholder="Enter year*"
                        textContentType="none"
                        keyboardType="numeric"
                        errorMessage={error}
                        onBlur={() => validateField()}
                        maxLength={24}
                      />
                    </View>
                  )}
                </View>
              </View>
              <View>
                <View style={styles.checkboxWrapper}>
                  <TouchableOpacity
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    accessibilityRole="checkbox"
                    style={styles.checkboxContainer}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        termsAccepted && styles.selectedCheckbox,
                      ]}
                    >
                      {termsAccepted && (
                        <IconCheckbox
                          width={14}
                          height={14}
                          stroke={colors.neutral[100]}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxText}>
                      I accept the {''}
                      <Text
                        style={styles.checkboxTextLink}
                        onPress={() => onPressPrivacyTerms(false)}
                      >
                        Terms of Use
                      </Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPrivacyAccepted(!privacyAccepted)}
                    accessibilityRole="checkbox"
                    style={styles.checkboxContainer}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        privacyAccepted && styles.selectedCheckbox,
                      ]}
                    >
                      {privacyAccepted && (
                        <IconCheckbox
                          width={14}
                          height={14}
                          stroke={colors.neutral[100]}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxText}>
                      I accept the {''}
                      <Text
                        style={styles.checkboxTextLink}
                        onPress={() => onPressPrivacyTerms(true)}
                      >
                        Privacy Policy
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.buttonContainer}>
                  <Button
                    title="Continue"
                    onPress={handleOnPress}
                    disabled={isDisabled}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}
