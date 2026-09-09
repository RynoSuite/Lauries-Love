import React, { useEffect, useState } from 'react';

import BottomSheetDonateTab from '../BottomSheetDonateTab/BottomSheetDonateTab';
import styles from './OtherValue.styles';
import colors from 'styles/colors';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import AmountContainer from '../AmountContainer/AmountContainer';
import { TextInput } from 'react-native';
import Button from 'components/Button/Button';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface OtherValueProps {
  amount: number;
  setAmount: (value: number) => void;
  currencyName: string;
  symbol: string;
}

export default function OtherValue({
  amount,
  setAmount,
  symbol,
  currencyName,
}: OtherValueProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [centAmount, setCentAmount] = useState(amount * 100);
  const [error, setError] = useState('');

  useEffect(() => {
    const number = Number((amount * 100).toFixed(2));
    setCentAmount(number);
  }, [amount]);

  function handleDonate() {
    if (amount < 1) return setError('Donation amount must be at least $1.');
    if (amount > 5000) return setError('Donation amount cannot exceed $5000.');

    setError('');
    setIsOpen(false);
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setIsOpen(true)}
      >
        {amount === 0 ? (
          <Text style={styles.input}>Other amount</Text>
        ) : (
          <LinearGradient
            colors={[colors.magenta, colors.magentaHi]}
            locations={[0, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.linearGradient}
          >
            <Text style={styles.linearGradientText}>
              {Number(amount).toLocaleString('en-US', {
                style: 'currency',
                currency: currencyName,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </Text>
          </LinearGradient>
        )}
      </TouchableOpacity>
      {isOpen && (
        <BottomSheetDonateTab
          title="Enter your donation"
          onClose={() => {
            setIsOpen(false);
            setIsInputFocused(false);
            setAmount(0);
          }}
          snapPoints={['90%']}
        >
          <View style={styles.container}>
            <TouchableOpacity onPress={() => setIsInputFocused(true)}>
              <AmountContainer
                amount={amount}
                error={error}
                currencyName={currencyName}
                symbol={symbol}
              />
              {isInputFocused && (
                <View style={{ height: 0, overflow: 'hidden' }}>
                  <TextInput
                    style={{ opacity: 0, position: 'absolute' }}
                    keyboardType="numeric"
                    onChangeText={text => {
                      const number = Number(text.replace(/[^0-9]/g, ''));
                      if (number <= 0) {
                        setAmount(0);
                      } else if (number >= 1 && number <= 5000_00) {
                        setAmount(number / 100);
                      } else {
                        setAmount(5000);
                      }
                    }}
                    value={String(centAmount)}
                    onBlur={() => setIsInputFocused(false)}
                    autoFocus
                  />
                </View>
              )}
            </TouchableOpacity>
            <Button title="Donate" onPress={handleDonate} />
          </View>
        </BottomSheetDonateTab>
      )}
    </ScrollView>
  );
}
