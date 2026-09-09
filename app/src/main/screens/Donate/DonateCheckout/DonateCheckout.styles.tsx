import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_700,
} from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  title: {
    paddingTop: 16,
    fontSize: 32,
    lineHeight: 40,
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  backButtonHide: {
    opacity: 0,
  },
  amountLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_RALEWAY_500,
    color: colors.muted,
  },
  paymentButtonContainer: {
    paddingVertical: 20,
  },
  appleButton: {
    width: WIDTH - 32,
    height: 48,
    borderRadius: 16,
    gap: 8,
    flexDirection: 'row',
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleText: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_RALEWAY_700,
  },
  googleButton: {
    width: WIDTH - 32,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleText: {
    color: colors.heading,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_RALEWAY_700,
  },
  creditCardIcons: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  orContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  orText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FONT_RALEWAY_500,
    color: colors.muted,
  },
  orLine: {
    height: 1,
    width: 35,
    backgroundColor: colors.neutral[700],
  },
});

export default styles;
