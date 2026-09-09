import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// providers
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';

// hooks
import useAuth from '../useAuth';

// components
import Button from 'components/Button/Button';
import Progress from 'components/Progress/Progress';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';

// constants
import { GENRES } from 'constants/onboarding';

// styles
import colors from 'styles/colors';
import { styles } from './your-gender.styles';

export default function YourGenderScreen() {
  const { updateUserDB } = useUserDBProvider();
  const { onPressBack } = useAuth();
  const navigation = useNavigation();
  const [gender, setGender] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOnPress = async () => {
    setIsLoading(true);
    try {
      await updateUserDB({ gender });

      // NOTE: DiagnosedYear doubles as the Terms & Privacy acceptance step,
      // so everyone still passes through it — but non-patient roles no longer
      // see or need the year field (fixed in diagnosed-year.screen.tsx).
      navigation.navigate('Authentication', {
        screen: 'DiagnosedYear',
      });
    } catch (error) {
      if (__DEV__)
        console.warn('YourGenderScreen -> handleOnPress -> error', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !gender || isLoading;

  return (
    <LinearGradient
      colors={[colors.ground, colors.surface, colors.deepwater]}
      locations={[0, 0.4, 1]}
      style={styles.linearGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.topSection}>
            <Progress value={80} />
            <TouchableOpacity
              onPress={onPressBack}
              style={{ alignSelf: 'flex-start' }}
            >
              <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={{ gap: 24 }}>
            <Text style={styles.title}>What’s your Gender?</Text>

            <View style={styles.buttonList}>
              {GENRES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.button,
                    gender === type.id && styles.buttonSelected,
                  ]}
                  onPress={() => setGender(type.id)}
                  accessibilityLabel={`Select ${type.label}`}
                  accessibilityState={{ selected: gender === type.id }}
                >
                  <Text style={styles.buttonText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
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
    </LinearGradient>
  );
}
