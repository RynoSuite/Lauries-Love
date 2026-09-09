import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// types
import { ItemsProfileTabType } from '../ProfileTab.types';
import { DefinitionType } from 'providers/DBProvider/DBProvider.types';
import { RootProfileTabParamList } from 'main/navigators/ProfileTabStacks/ProfileTabStacks.types';
import { UserDBType } from 'providers/UserDBProvider/UserDBProvider.types';

// providers
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { useUserAWSProvider } from 'providers/UserAWSProvider/UserAWSProvider';
import { useDBProvider } from 'providers/DBProvider/DBProvider';
import { usePosthogProvider } from 'providers/PosthogProvider/PosthogProvider';

// helps
import { getLocationCity } from 'utils/geolocation';

// components
import PersonalBlock from '../components/PersonalBlock/PersonalBlock';
import ProfileBlock from '../components/ProfileBlock/ProfileBlock';
import SettingsBlock from '../components/SettingsBlock/SettingsBlock';
import SelectProfileTabModal from '../components/SelectProfileTabModal/SelectProfileTabModal';
import CheckboxProfileTabModal from '../components/CheckboxProfileTabModal/CheckboxProfileTabModal';
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import InputProfileTabModal from '../components/InputProfileTabModal/InputProfileTabModal';
import DeleteProfileModal from '../components/DeleteProfileModal/DeleteProfileModal';
import AddressProfileModal from '../components/AddressProfileModal/AddressProfileModal';
import ButtonModalTabs from 'components/ButtonModalTabs/ButtonModalTabs';

// icons
import { IconMessages } from 'assets/icons-auto/components';

// backend
import { getIsSupportStaff } from 'services/supabase/supabase.support';

// constants
import { AGE_OPTIONS, GENDER_OPTIONS } from '../ProfileTab.constants';
import { PATHS_PROFILE_TAB } from 'main/navigators/paths';

// styles
import styles from './ProfileTabMain.styles';
import { useIntercom } from 'providers/IntercomProvider/IntercomProvider';

type ClientsMainScreenProps = {
  navigation: NativeStackNavigationProp<RootProfileTabParamList>;
};

const ProfileTabMain: FunctionComponent<ClientsMainScreenProps> = ({
  navigation,
}) => {
  const { bottom } = useSafeAreaInsets();
  const { onCapture } = usePosthogProvider();
  const { signOutIntercom } = useIntercom();
  const { userDB, updateUserDB, signOutDB } = useUserDBProvider();
  const { deleteAWS } = useUserAWSProvider();
  const {
    db: { designationTypes, diagnosisSubType, diagnosisType },
  } = useDBProvider();
  const [selectTypeModal, setSelectTypeModal] =
    useState<ItemsProfileTabType | null>(null);
  // Support agents (owners) get an extra inbox entry; hidden for everyone else.
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let active = true;
    getIsSupportStaff()
      .then(v => active && setIsStaff(v))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const getOptions = (values: DefinitionType[]) =>
    values.map(item => ({
      text: item?.description,
      value: item.id,
    }));

  const onPressDetails = useCallback(() => {
    navigation.navigate(PATHS_PROFILE_TAB.profileTabDetails);
  }, [navigation]);

  const onPressQR = useCallback(() => {
    navigation.navigate(PATHS_PROFILE_TAB.profileTabQR);
  }, [navigation]);

  const onPressGender = async (gender: string) => {
    const result = await updateUserDB({
      gender,
    });
    if (result && result.gender === gender) setSelectTypeModal(null);
  };

  const onPressAge = async (age: string) => {
    const result = await updateUserDB({
      age,
    });
    if (result && result.age === age) setSelectTypeModal(null);
  };

  const onPressDesignation = async (designationId: string) => {
    const selectRole = designationTypes.find(item => item.id === designationId);
    if (!selectRole) return;

    const result = await updateUserDB({
      role: selectRole,
    });
    const roleId =
      typeof result?.role === 'string' ? result?.role : result?.role?.id;
    if (result && roleId === designationId) setSelectTypeModal(null);
  };

  const onPressCancerType = async (cancerType: string[]) => {
    const diagnosisTypes = diagnosisType
      .filter(item => cancerType.includes(item.id))
      .map(item => item.id);
    const result = await updateUserDB({
      diagnosisTypes,
    });
    const isSame =
      result?.diagnosisTypes?.every((item, index) =>
        typeof item === 'string'
          ? cancerType.includes(item)
          : cancerType.includes(item.id),
      ) || false;
    if (result && result.diagnosisTypes && isSame) setSelectTypeModal(null);
  };

  const onPressSubCancerType = async (subCancerType: string[]) => {
    const diagnosisSubTypes = diagnosisSubType
      .filter(item => subCancerType.includes(item.id))
      .map(item => item.id);
    const result = await updateUserDB({
      diagnosisSubTypes,
    });
    const isSame =
      result?.diagnosisSubTypes?.every((item, index) =>
        typeof item === 'string'
          ? subCancerType.includes(item)
          : subCancerType.includes(item.id),
      ) || false;
    if (result && result.diagnosisSubTypes && isSame) setSelectTypeModal(null);
  };

  const onPressDiagnosedYear = async (diagnosisYear: string) => {
    const result = await updateUserDB({
      diagnosisYear,
    });
    const isSame = result?.diagnosisYear === diagnosisYear;
    if (result && result.diagnosisYear === diagnosisYear && isSame)
      setSelectTypeModal(null);
  };

  const onPressAddress = async (
    address: Pick<UserDBType, 'country' | 'city' | 'zipCode'>,
  ) => {
    try {
      if (!address.city || !address.country)
        throw new Error('Country and City are required.');

      const geoLocation = await getLocationCity(address.city, address.country);

      const result = await updateUserDB({ ...address, geoLocation });

      if (result) setSelectTypeModal(null);
    } catch (error) {
      if (__DEV__) console.warn('Failed to update address', error);
    }
  };

  const onPressSignOut = async () => {
    await signOutIntercom();

    await signOutDB();
    if (userDB?.email)
      onCapture({
        typeEvent: 'Logout',
        properties: {
          email: userDB.email,
        },
      });

    setSelectTypeModal(null);
  };

  const onPressDelete = async () => {
    // Capture analytics BEFORE the account (and session) disappear.
    if (userDB?.email)
      onCapture({
        typeEvent: 'DeleteAccount',
        properties: {
          email: userDB.email,
        },
      });

    // ORDER MATTERS (review 2026-07-06): deleteAWS() must run FIRST, while
    // the session is still alive — it invokes the delete-account edge
    // function (JWT identity) and the auth-user delete FK-cascades profiles
    // + profiles_private. The old flow called deleteUserDB() first, which
    // signed the session out, so the edge function was silently skipped and
    // the auth user survived every "Delete account".
    await deleteAWS();
    // Row is already gone via cascade — just clear local profile state.
    await signOutDB();

    setSelectTypeModal(null);
  };

  const onPressPrivacyTerms = (isPrivacy: boolean) => {
    const linkPrivacy = 'https://laurieslove.org/privacy-policy/';
    const linkTerms = 'https://laurieslove.org/terms-of-use/';
    Linking.openURL(isPrivacy ? linkPrivacy : linkTerms);
    setSelectTypeModal(null);
  };

  useEffect(() => {
    if (selectTypeModal === 'logout') onPressSignOut();
    if (selectTypeModal === 'terms') onPressPrivacyTerms(false);
    if (selectTypeModal === 'privacy') onPressPrivacyTerms(true);
  }, [selectTypeModal]);

  return (
    <>
      <BackgroundScreen>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.container,
            {
              paddingBottom: bottom + 120,
            },
          ]}
        >
          <View style={styles.container}>
            <View style={styles.profile}>
              <PersonalBlock
                onPressDetails={onPressDetails}
                onPressQR={onPressQR}
              />
              <ProfileBlock setSelectTypeModal={setSelectTypeModal} />
            </View>
            {isStaff && (
              <View style={{ marginTop: 8, paddingHorizontal: 16 }}>
                <ButtonModalTabs
                  Icon={IconMessages}
                  label="Support inbox"
                  onPress={() =>
                    navigation.navigate(
                      PATHS_PROFILE_TAB.profileTabSupportInbox,
                    )
                  }
                />
              </View>
            )}
            <SettingsBlock setSelectTypeModal={setSelectTypeModal} />
          </View>
        </ScrollView>
      </BackgroundScreen>
      {selectTypeModal === 'gender' && (
        <SelectProfileTabModal
          title="Update Gender"
          options={GENDER_OPTIONS}
          prevSelect={userDB?.gender || ''}
          onClose={() => setSelectTypeModal(null)}
          onSave={onPressGender}
        />
      )}
      {selectTypeModal === 'age' && (
        <SelectProfileTabModal
          title="Update Age"
          options={AGE_OPTIONS}
          prevSelect={userDB?.age || ''}
          onClose={() => setSelectTypeModal(null)}
          onSave={onPressAge}
        />
      )}
      {selectTypeModal === 'role' && (
        <SelectProfileTabModal
          title="Update Role"
          options={getOptions(designationTypes)}
          prevSelect={
            typeof userDB?.role === 'string'
              ? userDB?.role
              : userDB?.role?.id || ''
          }
          onClose={() => setSelectTypeModal(null)}
          onSave={onPressDesignation}
        />
      )}
      {selectTypeModal === 'cancerType' && (
        <CheckboxProfileTabModal
          title="Update Cancer Type"
          options={getOptions(diagnosisType)}
          prevSelect={
            userDB?.diagnosisTypes
              ? userDB.diagnosisTypes.map(item =>
                  typeof item === 'string' ? item : item.id,
                )
              : []
          }
          onClose={() => setSelectTypeModal(null)}
          onSave={onPressCancerType}
          scrollEnabled
        />
      )}
      {selectTypeModal === 'subCancerType' && (
        <CheckboxProfileTabModal
          title="Update Sub Cancer Type"
          options={getOptions(diagnosisSubType)}
          prevSelect={
            userDB?.diagnosisSubTypes
              ? userDB.diagnosisSubTypes.map(item =>
                  typeof item === 'string' ? item : item.id,
                )
              : []
          }
          onClose={() => setSelectTypeModal(null)}
          onSave={onPressSubCancerType}
          scrollEnabled
        />
      )}
      {selectTypeModal === 'diagnosedYear' && (
        <InputProfileTabModal
          title="Update Diagnosed Year"
          prevValue={userDB?.diagnosisYear || ''}
          onClose={() => setSelectTypeModal(null)}
          onSave={onPressDiagnosedYear}
        />
      )}
      {selectTypeModal === 'deleteAccount' && (
        <DeleteProfileModal
          onClose={() => setSelectTypeModal(null)}
          onPressDelete={onPressDelete}
        />
      )}
      {selectTypeModal === 'address' && userDB && (
        <AddressProfileModal
          title="Update Address"
          onClose={() => setSelectTypeModal(null)}
          user={userDB}
          onSave={onPressAddress}
        />
      )}
    </>
  );
};

export default ProfileTabMain;
