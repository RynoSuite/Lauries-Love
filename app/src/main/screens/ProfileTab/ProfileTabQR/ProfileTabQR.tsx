import React, { FunctionComponent, useMemo } from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import QRCode from 'react-qr-code';

// types
import { RootProfileTabParamList } from 'main/navigators/ProfileTabStacks/ProfileTabStacks.types';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';

// styles
import styles from './ProfileTabQR.styles';
import colors from 'styles/colors';

type ProfileTabQRProps = {
  navigation: NativeStackNavigationProp<RootProfileTabParamList>;
};

const ProfileTabQR: FunctionComponent<ProfileTabQRProps> = ({ navigation }) => {
  const qrCode = useMemo(() => {
    if (Platform.OS === 'android')
      return 'https://play.google.com/store/apps/details?id=com.lauriesloveapp';
    return `https://apps.apple.com/app/Laurie's-Love/1624981989`;
  }, []);

  const onPressBack = () => {
    navigation.goBack();
  };

  return (
    <BackgroundScreen type="home-main">
      <View style={styles.container}>
        <TouchableOpacity
          onPress={onPressBack}
          style={styles.backgroundButton}
        />
        <Text style={styles.title}>{'Share\nLaurie’s Love'}</Text>
        <View style={styles.card}>
          <QRCode
            size={200}
            value={qrCode}
            fgColor={colors.ground}
            bgColor={colors.white}
          />
        </View>
        <Text style={styles.hint}>
          Have someone scan this to find you on Laurie&rsquo;s Love.
        </Text>
      </View>
    </BackgroundScreen>
  );
};

export default ProfileTabQR;
