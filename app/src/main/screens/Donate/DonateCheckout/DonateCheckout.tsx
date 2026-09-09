import React, { useEffect, useMemo } from 'react';

import { Masks } from 'react-native-mask-input';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  DonateRouteProps,
  CreatePaymentModel,
  validateSchema,
} from './donate-checkout.model';
import { useDefaultValues } from './donate-checkout.handler';
import { useStorage } from 'presentation/hooks';
import BackgroundDonate from '../components/BackgroundDonate/BackgroundDonate';
import {
  IconApple,
  IconArrowLeft,
  IconGoogle,
} from 'assets/icons-auto/components';
import styles from './DonateCheckout.styles';
import Button from 'components/Button/Button';
import { CardBrandIcon } from 'presentation/ui/atoms';
import Checkbox from 'components/Checkbox/Checkbox';
import InputDonate from '../components/InputDonate/InputDonate';
import AmountContainer from '../components/AmountContainer/AmountContainer';
import colors from 'styles/colors';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useUserDBProvider } from 'providers/UserDBProvider/UserDBProvider';
import { getCurrency } from 'utils/getCurrency';

export default function DonateCheckout() {
  const { userDB } = useUserDBProvider();
  const { t } = useTranslation('screens');
  const { storedValue } = useStorage({
    key: '@billing-info',
    initialValue: {},
  });

  const navigation = useNavigation();

  const route = useRoute<DonateRouteProps<'donate-tab-checkout'>>();
  const { creatingPayment, submit, makeGooglePay, makeApplePay } =
    useDefaultValues();

  const { symbol, currencyName } = useMemo(() => {
    return getCurrency(userDB?.country ?? '');
  }, [userDB]);

  const methods = useForm<CreatePaymentModel>({
    mode: 'all',
    resolver: zodResolver(validateSchema),
    defaultValues: {
      remember: true,
      ...storedValue,
      paymentType: route.params.paymentType,
      inHonor: Boolean(route.params.inHonor),
      amount: route.params.amount,
    },
  });

  const {
    getValues,
    formState: { isValid, isSubmitting },
    handleSubmit,
  } = methods;

  useEffect(() => {
    methods.trigger();
  }, [getValues()]);

  return (
    <BackgroundDonate>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        contentContainerStyle={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <KeyboardAwareScrollView
          contentContainerStyle={styles.container}
          scrollEnabled
          enableOnAndroid
        >
          <FormProvider {...methods}>
            <View style={styles.titleContainer}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
              </TouchableOpacity>
              <Text style={styles.title}>
                Donation
                {route.params.inHonor && ' in Honor'}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backButtonHide]}
              >
                <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <AmountContainer
              amount={route.params.amount}
              currencyName={currencyName}
              symbol={symbol}
            >
              <Text style={styles.amountLabel}>Donation amount</Text>
            </AmountContainer>
            {route.params.inHonor && (
              <View>
                <View>
                  <InputDonate
                    label="Honor Name"
                    placeholder={t('donate.checkout.inputs.name.placeholder')}
                    value={methods.watch('inHonorName') ?? ''}
                    onChangeText={(value: string) =>
                      methods.setValue('inHonorName', value)
                    }
                  />
                </View>
              </View>
            )}
            <View style={styles.paymentButtonContainer}>
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  style={styles.appleButton}
                  onPress={() => makeApplePay(getValues(), route.params.amount)}
                  disabled={!route.params.amount || creatingPayment}
                >
                  <IconApple width={13} height={16} fill={colors.white} />
                  <Text style={styles.appleText}>Pay</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() =>
                    makeGooglePay(getValues(), route.params.amount)
                  }
                  disabled={!route.params.amount || creatingPayment}
                >
                  <IconGoogle width={16} height={16} />
                  <Text>Pay</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.orLine} />
            </View>
            <View>
              <InputDonate
                label="Cardholder Name"
                placeholder="Cardholder Name"
                required
                value={methods.watch('creditCard.cardHolderName') ?? ''}
                onChangeText={(value: string) =>
                  methods.setValue('creditCard.cardHolderName', value)
                }
              />
              <InputDonate
                required
                label="Address"
                placeholder="Address"
                value={methods.watch('address') ?? ''}
                onChangeText={(value: string) =>
                  methods.setValue('address', value)
                }
              />
              <InputDonate
                required
                mask={Masks.CREDIT_CARD}
                label="Card Number"
                placeholder="XXXX XXXX XXXX XXXX"
                textContentType="creditCardNumber"
                keyboardType="number-pad"
                value={methods.watch('creditCard.cardNumber.masked') ?? ''}
                onChangeText={(value: string) => {
                  methods.setValue('creditCard.cardNumber.masked', value);
                  methods.setValue(
                    'creditCard.cardNumber.unmasked',
                    value.replace(/\s/g, ''),
                  );
                }}
              />
              <View>
                <View>
                  <InputDonate
                    required
                    mask={[/\d/, /\d/, '/', /\d/, /\d/]}
                    label="Expiration Date"
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                    value={
                      methods.watch('creditCard.expirationDate.masked') ?? ''
                    }
                    onChangeText={(value: string) => {
                      methods.setValue(
                        'creditCard.expirationDate.masked',
                        value,
                      );
                      methods.setValue(
                        'creditCard.expirationDate.unmasked',
                        value.replace('/', ''),
                      );
                    }}
                  />
                </View>
                <View>
                  <InputDonate
                    required
                    mask={[/\d/, /\d/, /\d/, /\d?/]}
                    label="CVV"
                    placeholder="3 or 4 digits code"
                    keyboardType="number-pad"
                    value={methods.watch('creditCard.cvv.masked') ?? ''}
                    onChangeText={(value: string) => {
                      methods.setValue('creditCard.cvv.masked', value);
                      methods.setValue('creditCard.cvv.unmasked', value);
                    }}
                  />
                </View>
              </View>
              <View style={styles.creditCardIcons}>
                <CardBrandIcon icon="VISA" width={37.16} height={12} />
                <CardBrandIcon icon="MASTERCARD" width={19.42} height={12} />
                <CardBrandIcon
                  icon="AMERICANEXPRESS"
                  width={32.84}
                  height={12}
                />
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <Checkbox
                label="Remember this card"
                value={methods.watch('remember') ?? false}
                onChange={(value: boolean) =>
                  methods.setValue('remember', value)
                }
              />
              <Button
                disabled={!isValid || isSubmitting}
                onPress={handleSubmit(submit)}
                title="Donate"
                size="md"
              />
            </View>
          </FormProvider>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </BackgroundDonate>
  );
}
