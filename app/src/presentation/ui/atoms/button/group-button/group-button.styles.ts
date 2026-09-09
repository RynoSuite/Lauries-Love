import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    borderRadius: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  selected: {
    backgroundColor: colors.magenta,
  },
  text: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.body,
  },
  selectedText: {
    color: colors.white,
  }
});

export default styles;
