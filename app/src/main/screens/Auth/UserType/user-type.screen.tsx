import React, { useState } from 'react';
import {
  Keyboard,
  SafeAreaView,
  ScrollView,
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

// hooks
import useAuth from '../useAuth';

// components
import Button from 'components/Button/Button';
import Progress from 'components/Progress/Progress';

// icons
import { IconArrowLeft } from 'assets/icons-auto/components';
import {
  IconSmileyFace,
  IconTabHeart,
  IconTabHome,
  IconTabUser,
} from 'assets/icons-auto/components';

// styles
import colors from 'styles/colors';
import { styles } from './user-type.styles';

export default function UserTypeScreen() {
  const { updateUserDB } = useUserDBProvider();
  const { onPressBack } = useAuth();
  const navigation = useNavigation();
  const {
    db: { designationTypes },
  } = useDBProvider();
  const [userType, setUserType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOnPress = async () => {
    setIsLoading(true);
    const selectRole = designationTypes.find(item => item.id === userType);
    try {
      await updateUserDB({ role: selectRole });

      navigation.navigate('Authentication', {
        screen: 'CancerType',
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to update user', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = !userType || isLoading;

  function formatIcon(name: string) {
    const key = (name || '').toLowerCase();
    let IconComponent = IconTabUser;
    let strokeWidth = 2;

    if (key.includes('warrior') || key.includes('patient')) {
      IconComponent = IconTabHeart;
    } else if (key.includes('family')) {
      IconComponent = IconTabHome;
    } else if (key.includes('friend')) {
      IconComponent = IconSmileyFace;
      strokeWidth = 4;
    }
    // Anything else keeps the person icon rather than rendering nothing:
    // the roles come from the database, so the list here cannot be assumed
    // complete, and a card with no icon looks broken rather than generic.

    return (
      <IconComponent
        width={54}
        height={54}
        stroke={colors.heading}
        strokeWidth={strokeWidth}
      />
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
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View style={styles.contentContainer}>
              <View style={styles.topSection}>
                <Progress value={50} />
                <TouchableOpacity
                  onPress={onPressBack}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 24 }}>
                <Text style={styles.title}>What type of user are you?</Text>

                <View style={styles.buttonGrid}>
                  {designationTypes
                    .filter(type => {
                      const d = (type.description || '').toLowerCase();
                      return !(
                        d.includes('admin') ||
                        d.includes('staff') ||
                        d.includes('moderator') ||
                        d.includes('agent')
                      );
                    })
                    .map(type => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.button,
                        userType === type.id && styles.buttonSelected,
                      ]}
                      onPress={() => setUserType(type.id)}
                      accessibilityLabel={`Select ${type.description}`}
                      accessibilityState={{ selected: userType === type.id }}
                    >
                      {formatIcon(type.description)}

                      <Text style={styles.buttonText}>{type.description}</Text>
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
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}
