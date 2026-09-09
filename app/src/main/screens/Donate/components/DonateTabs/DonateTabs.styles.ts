import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FONT_RALEWAY_600,
  },
  box: {
    gap: 12,
  },
  otherInput: {
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: colors.line,
    borderRadius: 12,
  },
  buttons: {
    gap: 12,
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: FONT_RALEWAY_500,
    color: colors.faint,
  },
});

export default styles;
