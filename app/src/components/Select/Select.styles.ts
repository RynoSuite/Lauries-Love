import { StyleSheet } from 'react-native';

import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    height: 50,
    width: '100%',
    backgroundColor: colors.surface2,
  },
  buttonOpen: { height: 46, padding: 10, borderRadius: 10 },
  gradientBorder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    height: 50,
  },
  selectedText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
  modalContainer: {
    flex: 1,
  },
  dropdownContainer: {
    position: 'absolute',
    maxHeight: 254,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    // A border rather than the boxShadow this replaces: boxShadow is New
    // Architecture only and this app runs on the old one, so it was dropped
    // silently — and a shadow separates nothing on a dark ground anyway.
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    height: 50,
    borderBottomWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    height: 50,
    borderBottomWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  dropdownText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
  checkboxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  selectedCheckbox: {
    backgroundColor: colors.magenta,
    borderColor: colors.magenta,
  },
});

export default styles;
