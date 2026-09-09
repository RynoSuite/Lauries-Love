// src/main/screens/Auth/RecommendedGroups/recommended-groups.styles.ts

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
  title: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 36,
    lineHeight: 48,
    color: colors.heading,
  },
  listWrapper: {
    flex: 1,
    gap: 12,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surface2,
  },
  selectedChannelCard: {
    backgroundColor: colors.surface2,
    borderColor: colors.magentaText,
    borderWidth: 2,
  },
  channelName: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  checkboxSelected: {
    backgroundColor: colors.magenta,
    borderColor: colors.magentaText,
    borderWidth: 2,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipText: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.heading,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  infoText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.faint,
    textAlign: 'center',
  },
});
