import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_HANKEN_GROTESK_700, FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  amountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 52,
    lineHeight: 86,
    fontFamily: FONT_HANKEN_GROTESK_700,
  },
  amountCents: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FONT_HANKEN_GROTESK_700,
  },
  info: {
    color: colors.neutral[700],
    fontSize: 12,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 8,
  },
});

export default styles;
