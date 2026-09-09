import React, { FunctionComponent } from 'react';
import { View } from 'react-native';

// types
import { ItemsProfileTabType } from '../../ProfileTab.types';

// providers
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useDBProvider } from 'providers/DBProvider/DBProvider';

// components
import ButtonModalTabs from '../../../../../components/ButtonModalTabs/ButtonModalTabs';

// constants
import { LIST_BUTTONS_PERSONAL_BLOCK } from '../PersonalBlock/PersonalBlock.constants';
import { GENDER_OPTIONS } from '../../ProfileTab.constants';

// hooks
import { useCountry } from 'presentation/hooks';

// styles
import styles from './ProfileBlock.styles';

type ProfileBlockProps = {
  setSelectTypeModal: React.Dispatch<
    React.SetStateAction<ItemsProfileTabType | null>
  >;
};

const ProfileBlock: FunctionComponent<ProfileBlockProps> = ({
  setSelectTypeModal,
}) => {
  const { userDB } = useUserDBProvider();
  const {
    db: { diagnosisSubType, diagnosisType },
  } = useDBProvider();

  const { allCountries } = useCountry();

  const detDisabled = (type: ItemsProfileTabType) => {
    if (!userDB) return true;
    return false;
  };

  const getValue = (type: ItemsProfileTabType) => {
    if (!userDB) return 'Not set';
    if (type === 'role')
      return typeof userDB.role === 'string'
        ? userDB.role
        : userDB.role?.description || 'Not set';
    if (type === 'address') {
      const selectCountry = allCountries.find(
        country => country.code === userDB.country,
      );
      return selectCountry && userDB.zipCode
        ? `${selectCountry?.name}${userDB.zipCode ? ', ' + userDB.zipCode : ''}`
        : 'Not set';
    }
    if (type === 'age') return userDB.age || 'Not set';
    if (type === 'gender')
      return (
        GENDER_OPTIONS.find(gender => userDB.gender === gender.value)?.text ||
        'Not set'
      );
    if (type === 'cancerType') {
      //TODO
      const idFirstBad =
        userDB.diagnosisTypes && userDB.diagnosisTypes.length > 0
          ? userDB.diagnosisTypes[0]
          : null;
      const idFirst =
        typeof idFirstBad === 'string' ? idFirstBad : idFirstBad?.id || null;
      const type = diagnosisType.find(item => item.id === idFirst) || null;

      return type ? type.description : 'Not set';
    }
    if (type === 'subCancerType') {
      const idFirstBad =
        userDB.diagnosisSubTypes && userDB.diagnosisSubTypes.length > 0
          ? userDB.diagnosisSubTypes[0]
          : null;
      const idFirst =
        typeof idFirstBad === 'string' ? idFirstBad : idFirstBad?.id || null;
      const type = diagnosisSubType.find(item => item.id === idFirst) || null;

      return type ? type.description : 'Not set';
    }
    if (type === 'diagnosedYear') return userDB.diagnosisYear || 'Not set';
    return 'Not set';
  };

  const checkIfBreastCancer = () => {
    const diagnosisType = getValue('cancerType');
    return diagnosisType === 'Breast Cancer';
  };

  if (!userDB) return null;
  return (
    <View style={styles.container}>
      {LIST_BUTTONS_PERSONAL_BLOCK.filter(
        item =>
          (item.type === 'subCancerType' && checkIfBreastCancer()) ||
          item.type !== 'subCancerType',
      ).map((item, index) => {
        const value = getValue(item.type);
        const disabled = detDisabled(item.type);
        return (
          <ButtonModalTabs
            key={index}
            Icon={item.Icon}
            label={item.title}
            value={typeof value === 'string' ? value : 'Not set'}
            onPress={() => setSelectTypeModal(item.type)}
            disabled={disabled}
          />
        );
      })}
    </View>
  );
};

export default React.memo(ProfileBlock);
