import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500, FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14.5,
    paddingBottom: 20,
  },
  titleHeader: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    lineHeight: 36,
    color: colors.heading,
  },
  buttonHideHeader: {
    opacity: 0,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 21,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  cancelButton: {
    paddingRight: 20,
    paddingVertical: 12,
  },
  cancelText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.heading,
  },
  saveButton: {
    backgroundColor: colors.magenta,
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  saveText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white,
  },
  disabledButton: {
    backgroundColor: colors.line,
  },
});

export default styles;
