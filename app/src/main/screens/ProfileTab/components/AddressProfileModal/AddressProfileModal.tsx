import React, { FunctionComponent, useMemo, useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { isValidZipcode } from 'utils/zipcode-validation';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';

// types
import { UserDBType } from 'providers/UserDBProvider/UserDBProvider.types';
import { ToastType } from 'providers/ToastProvider/ToastProvider.types';

// providers
import { useKeyboardProvider } from 'providers/KeyboardProvider/KeyboardProvider';
import MessageToast from 'providers/ToastProvider/components/MessageToast/MessageToast';

// components
import BottomSheetProfileTab from '../BottomSheetProfileTab/BottomSheetProfileTab';
import ButtonInput from 'components/ButtonInput/ButtonInput';
import InputSearch from 'components/InputSearch/InputSearch';

// hooks
import { useCountry } from 'presentation/hooks';

// styles
import styles from './AddressProfileModal.styles';

type AddressProfileModalProps = {
  title: string;
  user?: UserDBType;
  onClose: () => void;
  onSave: (
    address: Pick<UserDBType, 'country' | 'city' | 'zipCode'>,
  ) => Promise<void>;
};

const AddressProfileModal: FunctionComponent<AddressProfileModalProps> = ({
  title,
  user,
  onClose,
  onSave,
}) => {
  const { showKeyboard } = useKeyboardProvider();
  const { supportedCountries, defaultCountry } = useCountry();
  const [isShowCountries, setIsShowCountries] = useState(false);
  const [search, setSearch] = useState('');
  const [address, setAddress] = useState({
    country: user?.country || defaultCountry.code,
    city: user?.city || '',
    zipCode: user?.zipCode || '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMessage, setShowMessage] = useState<ToastType | null>(null);

  const showCountries = useMemo(
    () =>
      supportedCountries.filter(
        ({ code, name }) =>
          name.toLowerCase().includes(search.toLowerCase()) ||
          code.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const snapPoints = useMemo(
    () => ['10%', isShowCountries ? '70%' : showKeyboard ? '40%' : '50%'],
    [isShowCountries, search, showKeyboard],
  );

  const index = useMemo(
    () => (isShowCountries ? 2 : 1),
    [isShowCountries, snapPoints],
  );

  const selectCountry = useMemo(
    () =>
      supportedCountries.find(({ code }) => code === address.country) || null,
    [address.country],
  );

  const isDisabled = useMemo(
    () =>
      address.zipCode === '' ||
      address.city === '' ||
      address.country === '' ||
      (address.zipCode === user?.zipCode &&
        address.city === user?.city &&
        address.country === user?.country),
    [address],
  );

  const onSelectedCountry = (newCountry: string) => {
    if (newCountry !== address.country) {
      setAddress({ ...address, country: newCountry, city: '', zipCode: '' });
    }
    setIsShowCountries(false);
  };

  const onSubmit = async () => {
    setIsLoading(true);
    try {
      const isValidZip = isValidZipcode(address.zipCode, address.country);
      if (!isValidZip)
        return setError(
          'Please enter a valid zip code for the selected country',
        );
      await onSave({
        ...address,
        city: address.city.trim(),
        zipCode: address.zipCode.trim(),
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to validate zipcode', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheetProfileTab
      title={title}
      index={index}
      disabled={isDisabled}
      onClose={onClose}
      onSubmit={onSubmit}
      snapPoints={snapPoints}
      isInputs
      isLoading={isLoading}
    >
      <View
        style={[styles.container, !isShowCountries && { paddingBottom: 0 }]}
      >
        <ButtonInput
          value={selectCountry?.name || ''}
          onPress={() => setIsShowCountries(!isShowCountries)}
          isSelect
        />
        {isShowCountries ? (
          <View style={styles.searchContainer}>
            <InputSearch
              search={search}
              setSearch={setSearch}
              isBottomSheet
              styleContainer={styles.inputContainerSearch}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
              {showCountries.map(country => (
                <TouchableOpacity
                  key={`country-${country.code}`}
                  style={styles.item}
                  onPress={() => onSelectedCountry(country.code)}
                >
                  <Text>{country.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <BottomSheetTextInput
                style={styles.input}
                value={address.city}
                onChangeText={city => setAddress({ ...address, city })}
                placeholder="City"
                maxLength={21}
              />
            </View>
            <View style={styles.inputContainer}>
              <BottomSheetTextInput
                style={styles.input}
                value={address.zipCode}
                onChangeText={zipCode => {
                  setError('');
                  setAddress({ ...address, zipCode });
                }}
                placeholder="Zip code"
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.error}>{error}</Text>
          </>
        )}
      </View>
      {showMessage && (
        <MessageToast
          message={showMessage}
          onFinish={() => setShowMessage(null)}
        />
      )}
    </BottomSheetProfileTab>
  );
};

export default AddressProfileModal;
