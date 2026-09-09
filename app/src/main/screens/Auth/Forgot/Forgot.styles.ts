import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
  FONT_RALEWAY_700,
} from 'styles/fonts';


const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
    paddingHorizontal: 16,
  },
  containerGradient: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    gap: 24,
  },
  topSection: {
    gap: 21,
    marginTop: 23,
  },
  title: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 36,
    lineHeight: 48,
    color: colors.heading,
  },
  subtitle: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.muted,
  },
  body: {
    gap: 12,
  },
  inputs: {
    gap: 12,
  },
  resendCodeText: {
    color: colors.faint,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    alignItems: 'center',
  },
  resendCodeLink: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.heading,
    textDecorationLine: 'underline',
  },
  subTitle: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.body,
    textAlign: 'center',
  },
  submitContainer: {
    paddingVertical: 12,
  },
  titleCreateAccount: {
    fontFamily: FONT_RALEWAY_700,
    color: colors.body,
    textDecorationLine: 'underline',
  },
});

export default styles;
