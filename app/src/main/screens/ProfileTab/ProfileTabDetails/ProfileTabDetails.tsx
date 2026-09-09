import React, { FunctionComponent, useEffect, useState } from 'react';
import { View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// types
import { RootProfileTabParamList } from 'main/navigators/ProfileTabStacks/ProfileTabStacks.types';
import { ItemsInfoProfileType } from '../ProfileTab.types';

// providers
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from '../../../../components/HeaderTabScreen/HeaderTabScreen';
import AvatarProfile from '../components/AvatarProfile/AvatarProfile';
import ButtonModalTabs from '../../../../components/ButtonModalTabs/ButtonModalTabs';
import AvatarProfileModal from '../components/AvatarProfileModal/AvatarProfileModal';

// constants
import { LIST_BUTTONS_INFO_BLOCK } from '../components/PersonalBlock/PersonalBlock.constants';
import { PATHS_PROFILE_TAB } from 'main/navigators/paths';

// hooks
import { useCountry } from 'presentation/hooks';

// styles
import styles from './ProfileTabDetails.styles';

type ProfileTabDetailsProps = {
  navigation: NativeStackNavigationProp<RootProfileTabParamList>;
};

const ProfileTabDetails: FunctionComponent<ProfileTabDetailsProps> = ({
  navigation,
}) => {
  const { userDB } = useUserDBProvider();

  const { allCountries, defaultCountry } = useCountry();

  const [selectTypeModal, setSelectTypeModal] =
    useState<ItemsInfoProfileType | null>(null);

  const onPressAvatarModal = () => {
    setSelectTypeModal('avatar');
  };

  const detDisabled = (type: ItemsInfoProfileType) => {
    if (!userDB) return true;
    return false;
  };

  const getValue = (type: ItemsInfoProfileType) => {
    if (!userDB) return 'Not set';
    if (type === 'fullName')
      return `${userDB.firstName}${
        userDB.lastName ? ` ${userDB.lastName}` : ''
      }`;
    if (type === 'email') return userDB.email;
    if (type === 'phone') {
      if (!userDB.phoneNumber) {
        return 'Not set';
      }

      const phoneNumberLocation =
        userDB.phoneNumberLocation ?? defaultCountry.code;
      const prefix =
        allCountries.find(c => c.code === phoneNumberLocation)?.prefix || '';
      if (prefix) {
        return `(+${prefix})${userDB.phoneNumber}`;
      }
      return userDB.phoneNumber;
    }
    return '';
  };

  const onPressTo = () => {
    if (selectTypeModal === 'email')
      navigation.navigate(PATHS_PROFILE_TAB.profileTabUpdateEmail);
    if (selectTypeModal === 'phone')
      navigation.navigate(PATHS_PROFILE_TAB.profileTabUpdatePhone);
    if (selectTypeModal === 'password')
      navigation.navigate(PATHS_PROFILE_TAB.profileTabUpdatePassword);
    if (selectTypeModal === 'fullName')
      navigation.navigate(PATHS_PROFILE_TAB.profileTabUpdateFullName);
    if (selectTypeModal !== 'avatar') setSelectTypeModal(null);
    return;
  };

  useEffect(() => {
    onPressTo();
  }, [selectTypeModal]);

  if (!userDB) return null;
  return (
    <>
      <BackgroundScreen>
        <View style={styles.container}>
          <HeaderTabScreen
            title="Personal Information"
            onPressLeft={() => navigation.goBack()}
          />
          <View style={styles.content}>
            <AvatarProfile
              user={userDB}
              type="big"
              onPress={onPressAvatarModal}
            />
            <View style={styles.list}>
              {LIST_BUTTONS_INFO_BLOCK.map((item, index) => {
                let value = getValue(item.type);
                const disabled = detDisabled(item.type);
                return (
                  <ButtonModalTabs
                    key={index}
                    Icon={item.Icon}
                    label={item.title}
                    value={value}
                    onPress={() => setSelectTypeModal(item.type)}
                    disabled={disabled}
                  />
                );
              })}
            </View>
          </View>
        </View>
      </BackgroundScreen>
      {selectTypeModal === 'avatar' && (
        <AvatarProfileModal
          userDB={userDB}
          onClose={() => setSelectTypeModal(null)}
        />
      )}
    </>
  );
};

export default ProfileTabDetails;
