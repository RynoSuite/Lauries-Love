import React, { useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MOCK_ENABLED } from 'mocks/mock.config';
import { setMockSignedIn } from 'mocks/mock.auth';
import { SUPABASE_ENABLED } from 'services/supabase/backend.config';
import { sbSignUp } from 'services/supabase/supabase.auth';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// providers
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// components
import Input from 'components/Input/Input';
import Button from 'components/Button/Button';
import Progress from 'components/Progress/Progress';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// styles
import colors from 'styles/colors';
import { styles } from './create-password.styles';
import PasswordRequirements, {
  isPasswordValid,
} from 'components/PasswordRequirements/PasswordRequirements';

export default function CreatePasswordScreen() {
  const navigation = useNavigation();
  const { checkCurrentUserAWS } = useUserAWSProvider();
  const { getUserDB, userOnboarding } = useUserDBProvider();

  const [account, setAccount] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

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

    if (field === 'password') {
      const password = account.password;

      // One source of truth: the checklist under the field decides, so the
      // list and the validation cannot drift apart.
      if (!isPasswordValid(password)) {
        error = 'Your password does not meet all the requirements below yet.';
      }
    }

    if (field === 'confirmPassword') {
      const { password, confirmPassword } = account;
      if (confirmPassword !== password) {
        error = 'Passwords don’t match';
      }
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [field]: error,
    }));
  }

  async function newAccount() {
    if (MOCK_ENABLED) {
      // Mock mode: skip Cognito signUp entirely; treat account as created.
      setMockSignedIn(true);
      return 'DONE';
    }
    if (SUPABASE_ENABLED) {
      try {
        setLoading(true);
        const result = await sbSignUp(userOnboarding.email, account.password);
        // With email confirmation off a session is returned immediately.
        return result.isComplete ? 'DONE' : 'CONFIRM_SIGN_UP';
      } catch (error: any) {
        if (__DEV__) console.warn('Supabase signUp error', error);
        setErrors(prevErrors => ({
          ...prevErrors,
          confirmPassword:
            error?.message ?? 'Could not create the account. Try again.',
        }));
        return null;
      } finally {
        setLoading(false);
      }
    }
    // Legacy Cognito signUp/signIn path removed — BACKEND is always
    // 'mock' or 'supabase', so this line is unreachable.
    return null;
  }

  async function handleOnPress() {
    const result = await newAccount();
    if (!result) return;

    if (result === 'CONFIRM_SIGN_UP')
      navigation.navigate('Authentication', {
        screen: 'VerifyEmail',
        params: {
          password: account.password,
        },
      });
    if (result === 'DONE') {
      // Mock: no sign-in needed. Supabase: signUp already returned a session.
      // (Legacy Cognito signIn call removed with aws-amplify.)
      const user = await checkCurrentUserAWS();
      if (user?.currentUser) {
        const token = user.authSession.tokens?.accessToken;
        await getUserDB(user.currentUser.userId, token);
      }
    }
  }

  const isDisabled =
    !account.password ||
    !account.confirmPassword ||
    !!errors.password ||
    !!errors.confirmPassword ||
    loading;

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
                <Progress value={20} />
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 24 }}>
                <View style={{ gap: 8 }}>
                  <Text style={styles.title}>Create Password</Text>
                  <Text style={styles.subtitle}>
                    Choose a password that meets all of the requirements below.
                  </Text>
                </View>
                <View style={styles.formSection}>
                  <Input
                    value={account.password}
                    onChangeText={password =>
                      setAccount({ ...account, password })
                    }
                    placeholder="Create password*"
                    isPassword
                    textContentType={'password'}
                    keyboardType={'default'}
                    errorMessage={errors.password}
                    onBlur={() => validateField('password')}
                    maxLength={24}
                  />
                  <PasswordRequirements password={account.password} />
                  <Input
                    value={account.confirmPassword}
                    onChangeText={confirmPassword =>
                      setAccount({ ...account, confirmPassword })
                    }
                    placeholder="Confirm password*"
                    isPassword
                    textContentType={'password'}
                    keyboardType={'default'}
                    errorMessage={errors.confirmPassword}
                    onBlur={() => validateField('confirmPassword')}
                    maxLength={24}
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
