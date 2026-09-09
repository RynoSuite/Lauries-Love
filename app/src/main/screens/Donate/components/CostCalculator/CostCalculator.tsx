import React from 'react';
import { CustomSlider } from 'presentation/ui/atoms';

import { useTranslation } from 'react-i18next';

import BottomSheetDonateTab from '../BottomSheetDonateTab/BottomSheetDonateTab';
import styles from './CostCalculator.styles';
import colors from 'styles/colors';
import { Text, View } from 'react-native';
import AmountContainer from '../AmountContainer/AmountContainer';
import { LinearGradient } from 'expo-linear-gradient';

type CostCalculatorProps = {
  symbol: string;
  currencyName: string;
};
export default function CostCalculator({
  symbol,
  currencyName,
}: CostCalculatorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [amount, setAmount] = React.useState({ value: 5, idx: 1 });

  const { t } = useTranslation('screens');
  /*
    It cost roughly $650 a month to run all 3 envs. If we divide that by 30 days we get $25/day to run the app. So if we divide that by 24 hours in a day. we get ~$1.05/hour. so if the minimum donation about is $5 that powers the app for roughly 4 hours and 45 minutes
   * */
  const baseDonation = 550; // price month

  const days = (30 * amount.value) / baseDonation;
  return (
    <View style={{ alignSelf: 'center', paddingVertical: 8 }}>
      <Text style={styles.text} onPress={() => setIsOpen(true)}>
        {t('donate.tabs.calculator.title')}
      </Text>
      {isOpen && (
        <BottomSheetDonateTab
          title="Cost Calculator"
          onClose={() => setIsOpen(false)}
          snapPoints={['70']}
          dynamic={false}
        >
          <View style={styles.container}>
            <View style={styles.paddedContainer}>
              <Text style={styles.title}>
                Where your donation to Laurie’s Love goes!
              </Text>

              <AmountContainer
                amount={amount.value}
                currencyName={currencyName}
                symbol={symbol}
              />
              <CustomSlider
                value={amount.idx}
                onChange={value => {
                  setAmount({ value: Number(value), idx: Number(value) });
                }}
                minimumValue={5}
                maximumValue={5000}
                step={5}
                container={{ trackMarks: [] }}
              />
              <Text style={styles.supportText}>
                {t('donate.tabs.calculator.support')}
              </Text>
              <LinearGradient
                colors={[`${colors.magenta}33`, `${colors.magentaHi}33`]}
                locations={[0.5, 1]}
                style={styles.daysContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.daysAmount}>
                  {days > 1 ? days.toFixed(0) : days.toFixed(2)}
                </Text>
                <Text style={styles.daysText}>Days</Text>
              </LinearGradient>
            </View>
          </View>
        </BottomSheetDonateTab>
      )}
    </View>
  );
}
