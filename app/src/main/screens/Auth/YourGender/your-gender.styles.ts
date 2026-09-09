import { StyleSheet } from 'react-native';

import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500, FONT_RALEWAY_500 } from 'styles/fonts';

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
    lineHeight: 48,
    color: colors.heading,
  },
  buttonList: {
    gap: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 21,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surface2,
  },
  buttonSelected: {
    borderColor: colors.magentaText,
    backgroundColor: colors.surface2,
    borderWidth: 2,
  },
  buttonText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
