import React, { FunctionComponent, useMemo, useState } from 'react';
import {
  Image,
  Keyboard,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// providers
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';
import { usePosthogProvider } from 'providers/PosthogProvider/PosthogProvider';

// components
import Button from 'components/Button/Button';
import Input from 'components/Input/Input';

// hooks
import { customShowError } from 'utils/other';

// images
import logo from '../../../../assets/images/logo-login.png';

// constants
import {
  DEFAULT_DATA_LOGIN,
  DEFAULT_ERROR_MESSAGES_LOGIN,
} from './Login.constants';
import { REGEX_EMAIL } from 'constants/regexp';

// styles
import styles from './Login.styles';
import colors from 'styles/colors';

const LoginScreen: FunctionComponent = () => {
  const navigation = useNavigation();
  const { showToast } = useToastProvider();
  const { userAWS, authAWS, signOutAWS } = useUserAWSProvider();
  const { onCapture } = usePosthogProvider();
  const [data, setData] = useState(DEFAULT_DATA_LOGIN);
  const [errorMessages, setErrorMessages] = useState(
    DEFAULT_ERROR_MESSAGES_LOGIN,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAuth, setIsAuth] = useState(false);

  const isNext = useMemo(() => data.email && data.password, [data]);

  const onLogin = async () => {
    setIsLoading(true);
    try {
      if (userAWS) await signOutAWS();
      const newErrorMessages = {
        email: REGEX_EMAIL.test(data.email)
          ? null
          : 'Invalid email address e.g. yourname@example.com',
        // Don't re-enforce signup complexity rules at LOGIN — let Supabase be
        // the authority. Re-checking here blocked valid/legacy passwords client
        // side with a misleading error before the server was ever called
        // (fix 2026-08-23).
        password: data.password ? null : 'Please enter your password',
      };
      if (newErrorMessages.email || newErrorMessages.password) {
        setErrorMessages(newErrorMessages);
        return;
      } else setErrorMessages(DEFAULT_ERROR_MESSAGES_LOGIN);
      const user = await authAWS(data.email, data.password);
      if (user) setIsAuth(true);
      if (!user) return;

      onCapture({
        typeEvent: 'Login',
        properties: {
          email: data.email,
        },
      });

      if (
        user &&
        user.nextStep.signInStep ===
          'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED'
      )
        navigation.navigate('Authentication', {
          screen: 'ChangePassword',
          params: {
            user,
          },
        });
    } catch (error) {
      customShowError({ error, showToast });
    } finally {
      setIsLoading(false);
    }
  };

  const onCreateAccount = () => {
    navigation.navigate('Authentication', {
      screen: 'CreateAccount',
    });
  };

  const onForgotPassword = () => {
    navigation.navigate('Authentication', {
      screen: 'ForgotPassword',
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView scrollEnabled={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Image source={logo} style={styles.image} resizeMode="contain" />
          <View style={styles.bottomSheet}>
            <LinearGradient
              colors={[colors.surface, colors.surface, colors.surface2]}
              locations={[0, 0.7, 1]}
              style={styles.containerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={styles.title}>Welcome back</Text>
              <View style={styles.body}>
                <View style={styles.inputs}>
                  <Input
                    value={data.email}
                    onChangeText={email => setData({ ...data, email })}
                    placeholder={'Email address'}
                    errorMessage={errorMessages.email}
                    textContentType={'emailAddress'}
                    keyboardType={'email-address'}
                    autoCapitalize="none"
                    maxLength={40}
                  />
                  <Input
                    isPassword
                    value={data.password}
                    onChangeText={password => setData({ ...data, password })}
                    placeholder={'Password'}
                    errorMessage={errorMessages.password}
                    textContentType={'password'}
                    keyboardType={'default'}
                    maxLength={24}
                  />
                  <TouchableOpacity onPress={onForgotPassword}>
                    <Text style={styles.titleForgotPassword}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.submitContainer}>
                  <Button
                    disabled={!isNext || isLoading}
                    title="Log in"
                    onPress={onLogin}
                  />
                  <Text style={styles.subTitle}>
                    Don't have an account?{' '}
                    <Text
                      onPress={onCreateAccount}
                      style={styles.titleCreateAccount}
                    >
                      Create account
                    </Text>
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;
