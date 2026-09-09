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
  mainContent: { gap: 24, flex: 1 },
  title: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 36,
    lineHeight: 48,
    color: colors.heading,
  },
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(238, 237, 231, 0.40)',
  },
  // The whole row, not just the checkbox: a 20px tick is a small cue on a
  // full-width card, and on a dark ground it was easy to miss entirely.
  listItemSelected: {
    borderColor: colors.magentaText,
    borderWidth: 2,
  },
  listText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  selectedCheckbox: {
    backgroundColor: colors.magenta,
    borderColor: colors.magentaText,
    borderWidth: 2,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
