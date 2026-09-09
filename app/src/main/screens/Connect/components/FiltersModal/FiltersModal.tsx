import React, { Dispatch, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';

import colors from 'styles/colors';
import Modal from 'components/Modal/Modal';
import styles from './FiltersModal.styles';
import Select from 'components/Select/Select';
import Button from 'components/Button/Button';
import { DefinitionType } from 'domain/models/base.model';
import { AGE_OPTIONS, DIAGNOSIS_OPTIONS, GENDER_OPTIONS } from 'constants/map';
import { useGetDefinitions } from 'presentation/services/react-query/definition.query';
import { useGetDesignations } from 'presentation/services/react-query/designation.query';
import { useCountry } from 'presentation/hooks';

type Props = {
  isFiltersOpen: boolean;
  setIsFiltersOpen: Dispatch<boolean>;
  designation: { id: string; label: string }[];
  setDesignation: Dispatch<{ id: string; label: string }[]>;
  age: { id: string; label: string }[];
  setAge: Dispatch<{ id: string; label: string }[]>;
  gender: { id: string; label: string }[];
  setGender: Dispatch<{ id: string; label: string }[]>;
  diagnosisType: { id: string; label: string }[];
  setDiagnosisType: Dispatch<{ id: string; label: string }[]>;
  diagnosisYear: { id: string; label: string }[];
  setDiagnosisYear: Dispatch<{ id: string; label: string }[]>;
  country: { id: string; label: string }[];
  setCountry: Dispatch<{ id: string; label: string }[]>;
  city: string;
  setCity: Dispatch<string>;
};

// Perf: React.memo — the parent screens re-render on every search keystroke
// and map region change; all props here (state setters + filter arrays) are
// referentially stable across those renders, so the modal tree is skipped.
export default React.memo(function FiltersModal({
  isFiltersOpen,
  setIsFiltersOpen,
  designation,
  setDesignation,
  age,
  setAge,
  gender,
  setGender,
  diagnosisType,
  setDiagnosisType,
  diagnosisYear,
  setDiagnosisYear,
  country,
  setCountry,
  city,
  setCity,
}: Props) {
  const designations = useGetDesignations();
  const diagnosisTypes = useGetDefinitions(DefinitionType.diagnosisType);

  const { supportedCountries } = useCountry();

  // Perf: option arrays are memoized — they were rebuilt on every render,
  // and DEFAULT_COUNTRIES' fresh identity made the effect below re-run on
  // every single render.
  const ROLE_OPTIONS = useMemo(
    () =>
      designations.data?.map(designation => ({
        id: designation.description,
        label: designation.description,
      })) || [],
    [designations.data],
  );
  const CANCER_OPTIONS = useMemo(
    () =>
      diagnosisTypes.data?.map(diagnosisType => ({
        id: diagnosisType.description,
        label: diagnosisType.description,
      })) || [],
    [diagnosisTypes.data],
  );
  const DEFAULT_COUNTRIES = useMemo(
    () =>
      supportedCountries.map(country => ({
        id: country.code,
        label: country.name,
      })),
    [supportedCountries],
  );

  const [isCityOnFocus, setIsCityOnFocus] = useState(false);

  function handleClear() {
    setDesignation([]);
    setAge([]);
    setGender([]);
    setDiagnosisType([]);
    setDiagnosisYear([]);
    setCountry(DEFAULT_COUNTRIES ? [...DEFAULT_COUNTRIES] : []);
    setCity('');
    setIsFiltersOpen(false);
  }

  function handleApply() {
    setIsFiltersOpen(false);
  }

  // Behavior preserved: whenever the country selection becomes empty it is
  // reset to the supported defaults (previously enforced by the effect
  // re-running every render; `country` in the deps keeps that guarantee).
  useEffect(() => {
    if (country.length === 0)
      setCountry(DEFAULT_COUNTRIES ? [...DEFAULT_COUNTRIES] : []);
  }, [DEFAULT_COUNTRIES, country]);

  return (
    <Modal onClose={setIsFiltersOpen} title="Filters" visible={isFiltersOpen}>
      <View style={styles.sectionGap}>
        <View style={styles.fieldGap}>
          <Text style={styles.label}>Role</Text>
          <Select
            options={ROLE_OPTIONS}
            selected={designation}
            onSelect={setDesignation}
          />
        </View>
        <View style={styles.fieldGap}>
          <Text style={styles.label}>Age</Text>
          <Select options={AGE_OPTIONS} selected={age} onSelect={setAge} />
        </View>
        <View style={styles.fieldGap}>
          <Text style={styles.label}>Gender</Text>
          <Select
            options={GENDER_OPTIONS}
            selected={gender}
            onSelect={setGender}
          />
        </View>
        <View style={styles.fieldGap}>
          <Text style={styles.label}>Cancer type</Text>
          <Select
            options={CANCER_OPTIONS}
            selected={diagnosisType}
            onSelect={setDiagnosisType}
          />
        </View>
        <View style={styles.fieldGap}>
          <Text style={styles.label}>Diagnosis year</Text>
          <Select
            options={DIAGNOSIS_OPTIONS}
            selected={diagnosisYear}
            onSelect={setDiagnosisYear}
          />
        </View>
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>City</Text>
          <LinearGradient
            colors={[colors.magenta, colors.lagoon]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.inputGradient}
          >
            <BottomSheetTextInput
              value={city}
              onChangeText={address => setCity(address)}
              placeholder="No Preference"
              style={[
                styles.textInput,
                isCityOnFocus && styles.focusedTextInput,
              ]}
              textContentType="addressCity"
              keyboardType="default"
              placeholderTextColor={colors.faint}
              onFocus={() => setIsCityOnFocus(true)}
              onBlur={() => {
                setIsCityOnFocus(false);
              }}
            />
          </LinearGradient>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Clear all"
          type="secondary"
          shape="rounded"
          onPress={handleClear}
          style={styles.filterAction}
        />
        <Button
          title="Apply filters"
          shape="rounded"
          onPress={handleApply}
          style={styles.filterAction}
        />
      </View>
    </Modal>
  );
});
