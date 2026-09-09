import React, { FunctionComponent, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// providers
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// components
import AvatarProfile from '../AvatarProfile/AvatarProfile';
import HeaderTabMain from 'components/HeaderTabMain/HeaderTabMain';

// icons
import { IconArrowRight } from 'assets/icons-auto/components';

// hooks
import { useCountry } from 'presentation/hooks';

// styles
import styles from './PersonalBlock.styles';
import colors from 'styles/colors';

type PersonalBlockProps = {
  onPressDetails: () => void;
  onPressQR: () => void;
};

const PersonalBlock: FunctionComponent<PersonalBlockProps> = ({
  onPressDetails,
  onPressQR,
}) => {
  const { userDB } = useUserDBProvider();

  const { allCountries, defaultCountry } = useCountry();

  const fullName = useMemo(() => {
    const firstName = userDB?.firstName || null;
    const lastName = userDB?.lastName || null;
    if (!firstName) return 'No name';

    return `${firstName}${lastName ? ` ${lastName}` : ''}`;
  }, [userDB]);

  const phonePrefix = useMemo(() => {
    const phoneNumberLocation =
      userDB?.phoneNumberLocation ?? defaultCountry.code;
    return allCountries.find(c => c.code === phoneNumberLocation)?.prefix || '';
  }, [userDB]);

  if (!userDB) return null;
  return (
    <View style={styles.container}>
      <HeaderTabMain title="Profile" onPressQR={onPressQR} />
      <TouchableOpacity style={styles.content} onPress={onPressDetails}>
        <View style={styles.infoContent}>
          <AvatarProfile user={userDB} />
          <View style={styles.titlesInfo}>
            <Text style={styles.titleInfo}>{fullName}</Text>
            <Text style={styles.subTitleInfo}>{userDB.email}</Text>
            <Text style={styles.phoneInfo}>
              {!!phonePrefix && `(+${phonePrefix})`}
              {userDB.phoneNumber}
            </Text>
          </View>
        </View>
        <IconArrowRight
          width={24}
          height={24}
          stroke={colors.heading}
          strokeWidth={2}
        />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(PersonalBlock);
