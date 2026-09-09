import React, { FunctionComponent, useMemo, useState } from 'react';
import {
  Keyboard,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// providers
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { usePosthogProvider } from 'providers/PosthogProvider/PosthogProvider';
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';

// components
import Button from 'components/Button/Button';
import Input from 'components/Input/Input';
// import { Loader } from 'presentation/ui/atoms';

// hooks
import { customShowError } from 'utils/other';

// constants
import {
  DEFAULT_DATA,
  DEFAULT_ERROR_MESSAGES,
} from './ForgotPassword.constants';
import { REGEX_EMAIL } from 'constants/regexp';
import PasswordRequirements, {
  isPasswordValid,
} from 'components/PasswordRequirements/PasswordRequirements';

// styles
import styles from './Forgot.styles';
import colors from 'styles/colors';
import { IconArrowLeft } from 'assets/icons-auto/components';

const ForgotPasswordScreen: FunctionComponent = () => {
  const navigation = useNavigation();
  const { showToast } = useToastProvider();
  const { forgotPassword, updatePassword } = useUserAWSProvider();
  const { onCapture } = usePosthogProvider();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [data, setData] = useState(DEFAULT_DATA);
  const [errorMessages, setErrorMessages] = useState(DEFAULT_ERROR_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);

  const isNext = useMemo(() => {
    if (step === 'email') {
      return data.email;
    } else {
      return (
        data.email && data.newPassword && data.confirmPassword && data.code
      );
    }
  }, [data, step]);

  const onSend = async () => {
    const newErrorMessages = {
      ...DEFAULT_ERROR_MESSAGES,
      email: REGEX_EMAIL.test(data.email)
        ? null
        : 'Please enter a valid email address',
    };
    if (Object.values(newErrorMessages).some(Boolean)) {
      setErrorMessages(newErrorMessages);
      return;
    } else setErrorMessages(DEFAULT_ERROR_MESSAGES);

    setIsLoading(true);
    try {
      await forgotPassword({ email: data.email });
      onCapture({
        typeEvent: 'ForgotPassword',
        properties: {
          email: data.email,
        },
      });
      setStep('password');
    } catch (error: any) {
      customShowError({ error, showToast });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordChange = async () => {
    const newErrorMessages = {
      ...DEFAULT_ERROR_MESSAGES,
      code: data.code.length === 6 ? null : 'Code must be 6 characters',
      newPassword: isPasswordValid(data.newPassword)
        ? null
        : 'Password must contain at least 8 characters, 1 letter, 1 number, and 1 special character',
      confirmPassword:
        data.newPassword === data.confirmPassword
          ? null
          : 'Passwords do not match',
    };
    if (Object.values(newErrorMessages).some(Boolean)) {
      setErrorMessages(newErrorMessages);
      return;
    } else setErrorMessages(DEFAULT_ERROR_MESSAGES);

    setIsLoading(true);
    try {
      await updatePassword({
        email: data.email,
        newPassword: data.newPassword,
        verificationCode: data.code,
      });
      onCapture({
        typeEvent: 'ResetPassword',
        properties: {
          email: data.email,
        },
      });
      showToast({ message: 'Password updated successfully', type: 'success' });
      navigation.navigate('Authentication', {
        screen: 'login',
      });

      setStep('password');
    } catch (error: any) {
      if (error?.name === 'CodeMismatchException') {
        customShowError({
          error: new Error('Invalid code'),
          showToast,
        });
      }
      customShowError({ error, showToast });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async () => {
    if (step === 'email') {
      onSend();
    } else {
      onPasswordChange();
    }
  };

  const onResend = async () => {
    await onSend();
    showToast({ message: 'Code sent successfully', type: 'info' });
  };

  return (
    <LinearGradient
      colors={[colors.ground, colors.surface, colors.deepwater]}
      locations={[0, 0.4, 1]}
      style={styles.containerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <ScrollView
            scrollEnabled={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {/* {isLoading && (
              <Loader
                position="absolute"
                width="100%"
                height="100%"
                zIndex={100}
              />
            )} */}
            <View style={styles.contentContainer}>
              <View style={styles.topSection}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 8 }}>
                <Text style={styles.title}>
                  {step === 'email' ? 'Forgot Password' : 'Update Password'}
                </Text>
                <Text style={styles.subtitle}>
                  {step === 'email'
                    ? 'Enter the email address you used for creating your account and we’ll send you link to reset your password.'
                    : `Please enter 6 digit code sent to ${data.email} to update password`}
                </Text>
              </View>
              <View style={styles.body}>
                <View style={styles.inputs}>
                  {step === 'email' ? (
                    <>
                      <Input
                        value={data.email}
                        onChangeText={email => setData({ ...data, email })}
                        placeholder={'Email address'}
                        errorMessage={errorMessages.email}
                        textContentType={'emailAddress'}
                        keyboardType={'email-address'}
                        maxLength={40}
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        value={data.code}
                        onChangeText={code => setData({ ...data, code })}
                        placeholder={'Code'}
                        errorMessage={errorMessages.code}
                        keyboardType={'number-pad'}
                        maxLength={6}
                      />
                      <Text style={styles.resendCodeText}>
                        Didn't receive the code?{' '}
                        <Text style={styles.resendCodeLink} onPress={onResend}>
                          Resend code
                        </Text>
                      </Text>
                      <Input
                        value={data.newPassword}
                        onChangeText={newPassword =>
                          setData({ ...data, newPassword })
                        }
                        placeholder={'New Password'}
                        errorMessage={errorMessages.newPassword}
                        textContentType={'password'}
                        isPassword
                        maxLength={24}
                      />
                      <PasswordRequirements password={data.newPassword} />
                      <Input
                        value={data.confirmPassword}
                        onChangeText={confirmPassword =>
                          setData({ ...data, confirmPassword })
                        }
                        placeholder={'Confirm Password'}
                        errorMessage={errorMessages.confirmPassword}
                        textContentType={'password'}
                        isPassword
                        maxLength={24}
                      />
                    </>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.submitContainer}>
              <Button
                disabled={!isNext || isLoading}
                title="Reset Password"
                onPress={onSubmit}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;
