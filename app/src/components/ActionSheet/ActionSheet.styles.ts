import { Platform, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    // Clears the home indicator on a modern iPhone.
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  grabber: {
    backgroundColor: colors.lineStrong,
    width: 40,
    height: 4,
  },
  title: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 17,
    lineHeight: 24,
    color: colors.heading,
    paddingHorizontal: 4,
  },
  message: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  items: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  itemPressed: {
    backgroundColor: colors.line,
  },
  itemIcon: {
    width: 22,
    alignItems: 'center',
  },
  itemLabel: {
    flex: 1,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  itemLabelDestructive: {
    color: colors.danger,
  },
  cancel: {
    marginTop: 10,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center',
  },
  cancelLabel: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
  },
});

export default styles;
