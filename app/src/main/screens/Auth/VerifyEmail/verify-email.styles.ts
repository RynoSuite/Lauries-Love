import { StyleSheet } from 'react-native';

import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500, FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  linearGradient: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    gap: 24,
    paddingHorizontal: 16,
  },
  topSection: {
    gap: 21,
    marginTop: 23,
  },
  progressContainer: {
    gap: 21,
  },
  chevronIcon: {
    marginTop: 23,
  },
  title: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 36,
    color: colors.heading,
  },
  subtitle: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.muted,
  },
  formSection: {
    gap: 12,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeResendContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    fontFamily: FONT_RALEWAY_500,
    color: colors.heading,
  },
  resendLink: {
    fontSize: 14,
    fontFamily: FONT_RALEWAY_600,
    color: colors.heading,
    textDecorationLine: 'underline',
  },
});
