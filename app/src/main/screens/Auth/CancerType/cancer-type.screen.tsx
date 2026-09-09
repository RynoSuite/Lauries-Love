import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// providers
import { useDBProvider } from 'providers/DBProvider/DBProvider';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// components
import Button from 'components/Button/Button';
import Progress from 'components/Progress/Progress';
import Searchbar from 'components/Searchbar/Searchbar';

// hooks
import useAuth from '../useAuth';

// icons
import { IconArrowLeft, IconCheckbox } from 'assets/icons-auto/components';

// styles
import colors from 'styles/colors';
import { styles } from './cancer-type.styles';

export default function CancerTypeScreen() {
  const { updateUserDB } = useUserDBProvider();
  const { onPressBack } = useAuth();
  const navigation = useNavigation();
  const {
    db: { diagnosisType },
  } = useDBProvider();

  const [query, setQuery] = useState('');
  const [cancerType, setCancerType] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const filteredCancerTypes = diagnosisType.filter(type =>
    type.description.toLowerCase().includes(debouncedQuery.toLowerCase()),
  );

  const handleOnPress = async () => {
    setIsLoading(true);
    try {
      await updateUserDB({ diagnosisTypes: [cancerType] });
      const matchDiagnosisType = diagnosisType.find(
        type => type.id === cancerType,
      );
      if (matchDiagnosisType?.description === 'Breast Cancer')
        navigation.navigate('Authentication', {
          screen: 'SubCancerType',
        });
      else
        navigation.navigate('Authentication', {
          screen: 'YourAge',
        });
    } catch (error) {
      if (__DEV__) console.warn('Failed to update user', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !cancerType || isLoading;

  function renderItem({ item }: { item: { id: string; description: string } }) {
    return (
      <TouchableOpacity
        onPress={() => setCancerType(item.id)}
        style={styles.listItem}
      >
        <Text style={styles.listText}>{item.description}</Text>

        <View
          style={[
            styles.checkbox,
            cancerType === item.id && styles.selectedCheckbox,
          ]}
        >
          {cancerType === item.id && (
            <IconCheckbox width={14} height={14} stroke={colors.neutral[100]} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <LinearGradient
      colors={[colors.ground, colors.surface, colors.deepwater]}
      locations={[0, 0.4, 1]}
      style={styles.linearGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.container}>
          <View style={styles.contentContainer}>
            <View style={styles.topSection}>
              <Progress value={60} />
              <TouchableOpacity
                onPress={onPressBack}
                style={{ alignSelf: 'flex-start' }}
              >
                <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.mainContent}>
              <Text style={styles.title}>Cancer Type</Text>

              <View style={{ flex: 1, gap: 21 }}>
                <Searchbar
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search"
                />
                <FlatList
                  data={filteredCancerTypes}
                  keyExtractor={item => item.id}
                  renderItem={renderItem}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </View>
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Continue"
              onPress={handleOnPress}
              disabled={isDisabled}
            />
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}
