import React, { useEffect } from 'react';
import styles from './DonateInvoice.styles';
import { useNavigation, useRoute } from '@react-navigation/native';

import { DonateRouteProps } from '../DonateCheckout/donate-checkout.model';
import Invoice from '../components/Invoice/Invoice';
import BackgroundDonate from '../components/BackgroundDonate/BackgroundDonate';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import {
  IconArrowLeft,
  IconGreenCheck,
  IconTypeLogo,
} from 'assets/icons-auto/components';
import { PATHS_DONATE_TAB } from 'main/navigators/paths';
import { captureRef } from 'react-native-view-shot';
import Footer from '../components/InvoiceFooter/Footer';
import * as MediaLibrary from 'expo-media-library';
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';
import colors from 'styles/colors';
import { usePermissionsProvider } from 'providers/PermissionsProvider/PermissionsProvider';
import { ScrollView } from 'react-native-gesture-handler';

export default function DonateInvoice() {
  const route = useRoute<DonateRouteProps<'donate-tab-invoice'>>();

  const { permissions, requestPermissionsImagePicker } =
    usePermissionsProvider();

  const navigation = useNavigation();
  const imageRef = React.useRef<View>(null);
  const { showToast } = useToastProvider();
  const [takingScreenshot, setTakingScreenshot] = React.useState(false);
  const [isSharing, setIsSharing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const isNew = route.params?.isNew;

  const takeScreenshot = async () => {
    try {
      const uri = await captureRef(imageRef, {
        format: 'jpg',
        quality: 0.8,
      });
      return uri;
    } catch (error) {
      console.error(error);
    } finally {
      setTakingScreenshot(false);
    }
  };

  const shareInvoice = async () => {
    const uri = await takeScreenshot();
    if (!uri) return;
    Share.share({
      title: "Laurie's Love Donation",
      url: uri,
    });
  };

  useEffect(() => {
    if (!takingScreenshot) return;
    if (isSharing) {
      shareInvoice();
      setIsSharing(false);
    } else if (isSaving) {
      saveInvoice();
      setIsSaving(false);
    }
  }, [takingScreenshot]);

  const saveInvoice = async () => {
    try {
      if (permissions.imagePicker !== 'granted') {
        setTakingScreenshot(false);
        setIsSaving(false);
        await requestPermissionsImagePicker();
      }
      const status = permissions.imagePicker;
      if (status !== 'granted') return;
      takeScreenshot().then(uri => {
        if (!uri) {
          return;
        }
        MediaLibrary.saveToLibraryAsync(uri);
        showToast({
          message: 'Invoice saved to gallery',
          type: 'success',
        });
      });
    } catch (error) {
      console.error(error);
      setTakingScreenshot(false);
      setIsSaving(false);
    }
  };

  const goBack = () => {
    navigation.navigate('Donate', {
      screen: PATHS_DONATE_TAB.donateTabMain,
    });
  };

  return (
    <>
      {takingScreenshot && (
        <View style={styles.screenshotLoader}>
          {/* <Spinner color={colors.neutral[700]} size="lg" /> */}
        </View>
      )}
      <ScrollView>
        <View ref={imageRef} style={styles.imageRef} collapsable={false}>
          <BackgroundDonate>
            <View style={styles.container}>
              <View
                style={[styles.titleContainer, !isNew && { paddingBottom: 40 }]}
              >
                <TouchableOpacity onPress={goBack}>
                  <IconArrowLeft
                    width={28}
                    height={28}
                    stroke={colors.heading}
                    strokeWidth={2}
                    style={takingScreenshot && styles.backButtonHide}
                  />
                </TouchableOpacity>
                {isNew && !takingScreenshot ? (
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <IconGreenCheck width={61} height={61} />
                    <Text style={styles.title}>
                      Thank you for your donation!
                    </Text>
                  </View>
                ) : (
                  <IconTypeLogo width={186} height={40} />
                )}
                <TouchableOpacity
                  onPress={goBack}
                  style={[styles.backButtonHide]}
                >
                  <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <Invoice />
              </View>
            </View>
          </BackgroundDonate>
        </View>
        <Footer
          isNew={isNew}
          onSave={() => {
            setIsSaving(true);
            setTakingScreenshot(true);
          }}
          onShare={() => {
            setIsSharing(true);
            setTakingScreenshot(true);
          }}
        />
      </ScrollView>
    </>
  );
}
