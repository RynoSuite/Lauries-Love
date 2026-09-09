import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// providers
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';
import { useActionSheet } from 'providers/ActionSheetProvider/ActionSheetProvider';

const useAuth = (isNotBack: boolean = false) => {
  const { showSheet } = useActionSheet();
  const { userAWS, signOutAWS } = useUserAWSProvider();
  const navigation = useNavigation();

  const logOut = async () => {
    try {
      if (userAWS) await signOutAWS();
      navigation.navigate('Authentication', {
        screen: 'login',
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to log out', error);
    }
  };

  const onPressBack = async () => {
    const isBack = navigation.canGoBack();

    if (isBack && !isNotBack) navigation.goBack();
    else
      showSheet({
        title: 'Log out',
        message: 'You will need to sign in again next time.',
        items: [{ label: 'Log out', destructive: true, onPress: logOut }],
      });
  };

  return {
    onPressBack,
  };
};

export default useAuth;
