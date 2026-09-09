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
  },
  modalContainer: {
    flex: 1,
  },
  dropdownContainer: {
    position: 'absolute',
    maxHeight: 254,
    borderRadius: 12,
    backgroundColor: '#F1F1EC',
    overflow: 'hidden',
    boxShadow: '0px 4px 7.4px 0px rgba(0, 0, 0, 0.15)',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    height: 50,
    borderBottomWidth: 1,
    borderColor: colors.neutral[100],
    backgroundColor: '#F1F1EC',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    height: 50,
    borderBottomWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor: colors.neutral[100],
    backgroundColor: '#F1F1EC',
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
    borderColor: colors.neutral[600],
  },
  selectedCheckbox: {
    backgroundColor: colors.magenta,
    borderColor: colors.primary[500],
  },
});

export default styles;
