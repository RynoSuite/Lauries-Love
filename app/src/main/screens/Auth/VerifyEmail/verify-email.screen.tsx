import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  sbConfirmSignUp,
  sbResendSignUpCode,
} from 'services/supabase/supabase.auth';
import {
  RouteProp,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

// providers
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// hooks
import useAuth from '../useAuth';

// components
import Button from 'components/Button/Button';
import OTPInput from 'components/OTPInput/OTPInput';
import Progress from 'components/Progress/Progress';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// styles
import colors from 'styles/colors';
import { styles } from './verify-email.styles';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { useCountry } from 'presentation/hooks';

export default function VerifyEmailScreen() {
  const { showToast } = useToastProvider();
  const { authAWS, checkCurrentUserAWS } = useUserAWSProvider();
  const { createUserDB, getUserDB, userOnboarding } = useUserDBProvider();
  const { onPressBack } = useAuth(true);
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<{ params: { password: string } }, 'params'>>();
  const { defaultCountry } = useCountry();

  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const { password } = route.params || '';

  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

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

  async function handleResendCode() {
    try {
      // Supabase is the only real backend for this screen — the legacy
      // Cognito resendSignUpCode path is gone with aws-amplify.
      await sbResendSignUpCode(userOnboarding.email);
      showToast({ message: 'Code sent successfully', type: 'info' });
      setTimer(30);
    } catch (error) {
      setError('There was an error sending the code');
    }
  }

  async function handleContinue() {
    setIsLoading(true);
    try {
      // Supabase: verifyOtp confirms the email AND returns a session, so we
      // can run the same downstream flow (authAWS routes to Supabase sign-in
      // in this mode; createUserDB patches the trigger-created profile row).
      // Legacy Cognito confirmSignUp path removed with aws-amplify.
      const { isSignUpComplete } = await sbConfirmSignUp(
        userOnboarding.email,
        code.join(''),
      );

      if (isSignUpComplete) {
        const response = await authAWS(userOnboarding.email, password);
        const userAWS = await checkCurrentUserAWS();
        const userId = userAWS?.currentUser.userId;
        const token = userAWS?.authSession.tokens?.accessToken;
        const result = await createUserDB({
          displayName: userOnboarding.fullName,
          cognitoId: userId,
          firstName: userOnboarding.fullName,
          lastName: null,
          email: userOnboarding.email,
          phoneNumber: userOnboarding.phone,
          phoneNumberLocation:
            userOnboarding?.phoneLocation || defaultCountry.code,
          diagnosisYear: '',
          zipCode: userOnboarding.zipCode || '',
          country: userOnboarding.country || '',
          city: userOnboarding.city || '',
          geoLocation: userOnboarding.geoLocation || {
            latitude: 0,
            longitude: 0,
          },
          diagnosisTypes: null,
          diagnosisSubTypes: null,
          age: userOnboarding.ageRange || '',
          gender: userOnboarding.gender || '',
          role: null,
          profilePicture: null,
        });

        if (result && userId) await getUserDB(userId, token);

        if (response?.isSignedIn) {
          setIsLoading(false);
          navigation.navigate('Authentication', {
            screen: 'YourAddress',
          });
        }
      }
    } catch (error) {
      setError('Invalid code');
    } finally {
      setIsLoading(false);
    }
  }

  const isDisabled = code.some(digit => digit === '') || code.length !== 6;

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
                <Progress value={30} />
                <TouchableOpacity
                  onPress={onPressBack}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 24 }}>
                <View style={{ gap: 8 }}>
                  <Text style={styles.title}>Verify Email</Text>
                  <Text style={styles.subtitle}>
                    Please enter 6 digit code sent to
                  </Text>
                  <Text style={styles.subtitle}>{userOnboarding.email}</Text>
                </View>
                <View style={styles.formSection}>
                  <OTPInput
                    code={code}
                    setCode={setCode}
                    error={error}
                    setError={setError}
                  />
                  <View style={styles.codeResendContainer}>
                    <Text style={styles.resendText}>
                      Didn’t Receive a code?
                    </Text>
                    <TouchableOpacity
                      onPress={handleResendCode}
                      disabled={timer > 0}
                    >
                      <Text
                        style={[
                          styles.resendLink,
                          timer > 0 && { opacity: 0.5 },
                        ]}
                      >
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend code'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="Continue"
                onPress={handleContinue}
                disabled={isDisabled || isLoading}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}
