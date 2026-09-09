import React, { FunctionComponent, useMemo, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// types
import { RootProfileTabParamList } from 'main/navigators/ProfileTabStacks/ProfileTabStacks.types';

// providers
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from '../../../../components/HeaderTabScreen/HeaderTabScreen';
import Input from 'components/Input/Input';
import Button from 'components/Button/Button';

// constants
import PasswordRequirements, {
  isPasswordValid,
} from 'components/PasswordRequirements/PasswordRequirements';

// styles
import styles from './ProfileTabMainUpdatePassword.styles';

type ProfileTabMainUpdatePasswordProps = {
  navigation: NativeStackNavigationProp<RootProfileTabParamList>;
};

const ProfileTabMainUpdatePassword: FunctionComponent<
  ProfileTabMainUpdatePasswordProps
> = ({ navigation }) => {
  const { bottom } = useSafeAreaInsets();
  const { updatePasswordAWS } = useUserAWSProvider();
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errorMessages, setErrorMessages] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const isChangingPassword = useMemo(
    () =>
      passwords.oldPassword !== '' &&
      passwords.newPassword !== '' &&
      passwords.confirmPassword !== '' &&
      passwords.newPassword === passwords.confirmPassword &&
      isPasswordValid(passwords.newPassword),
    [passwords],
  );

  const onBlur = (type: 'oldPassword' | 'newPassword' | 'confirmPassword') => {
    if (type === 'oldPassword')
      setErrorMessages(prev => ({
        ...prev,
        oldPassword: passwords.oldPassword === '' ? 'Required' : '',
      }));
    if (type === 'newPassword')
      setErrorMessages(prev => ({
        ...prev,
        newPassword:
          passwords.newPassword === ''
            ? 'Required'
            : !isPasswordValid(passwords.newPassword)
            ? 'Password must contain at least 8 characters, 1 number, 1 special character and a combination of uppercase and lowercase'
            : '',
      }));
    if (type === 'confirmPassword')
      setErrorMessages(prev => ({
        ...prev,
        confirmPassword:
          passwords.confirmPassword === ''
            ? 'Required'
            : passwords.newPassword !== passwords.confirmPassword
            ? 'Passwords do not match'
            : '',
      }));
  };

  const ERROR_MESSAGES = {
    incorrect: 'Incorrect password. Please try again.',
    tooManyAttempts: 'Too many attempts. Please try again later.',
    unexpected: 'An unexpected error occurred. Please try again.'
  };

  const handleContinue = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) return;
    
    const oldPwd = passwords.oldPassword;
    const newPwd = passwords.newPassword;
    
    const result = await updatePasswordAWS(oldPwd, newPwd);

    if (result === true) {
      navigation.goBack();
    } else if (result === 'NotAuthorizedException') {
      setErrorMessages(state => ({
        ...state,
        oldPassword: ERROR_MESSAGES.incorrect,
      }));
    } else if (result === 'LimitExceededException') {
      setErrorMessages(state => ({
        ...state,
        oldPassword: ERROR_MESSAGES.tooManyAttempts,
      }));
    } else {
      setErrorMessages(state => ({
        ...state,
        oldPassword: ERROR_MESSAGES.unexpected,
      }));
    }
  };

  return (
    <BackgroundScreen type="updateProfile">
      <HeaderTabScreen onPressLeft={() => navigation.goBack()} />
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.screen}>
          <View style={styles.titles}>
            <Text style={styles.title}>Update Password</Text>
            <Text style={styles.subTitle}>Create new password</Text>
          </View>
          <View style={styles.inputs}>
            <Input
              value={passwords.oldPassword}
              onChangeText={value => {
                setErrorMessages(prev => ({ ...prev, oldPassword: '' }));
                setPasswords(prev => ({ ...prev, oldPassword: value }));
              }}
              placeholder={'Current password*'}
              textContentType="password"
              keyboardType="visible-password"
              isPassword
              onBlur={() => onBlur('oldPassword')}
              errorMessage={errorMessages.oldPassword}
              maxLength={24}
            />
            <Input
              value={passwords.newPassword}
              onChangeText={value => {
                setErrorMessages(prev => ({ ...prev, newPassword: '' }));
                setPasswords(prev => ({ ...prev, newPassword: value }));
              }}
              placeholder={'New password*'}
              keyboardType="visible-password"
              isPassword
              onBlur={() => onBlur('newPassword')}
              errorMessage={errorMessages.newPassword}
              maxLength={24}
            />
            <PasswordRequirements password={passwords.newPassword} />
            <View style={styles.lastInput}>
              <Input
                value={passwords.confirmPassword}
                onChangeText={value => {
                  setErrorMessages(prev => ({ ...prev, confirmPassword: '' }));
                  setPasswords(prev => ({ ...prev, confirmPassword: value }));
                }}
                placeholder={'Confirm new password*'}
                keyboardType="visible-password"
                isPassword
                onBlur={() => onBlur('confirmPassword')}
                errorMessage={errorMessages.confirmPassword}
                maxLength={24}
              />
              <Text style={styles.subtitleInputs}>
                Create a password with at least 8 characters, 1 number and 1
                special character and a combination of uppercase and lowercase
              </Text>
            </View>
          </View>
        </View>
        <View
          style={[
            styles.buttonContainer,
            {
              paddingBottom: bottom + 10,
            },
          ]}
        >
          <Button
            title="Reset password"
            onPress={handleContinue}
            disabled={!isChangingPassword}
          />
        </View>
      </ScrollView>
    </BackgroundScreen>
  );
};

export default ProfileTabMainUpdatePassword;
