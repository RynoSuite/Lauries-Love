import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 2,
    gap: 8,
  },
  inputContainer: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
  },
  input: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
    paddingHorizontal: 21,
    paddingVertical: 15,
  },
  buttons: {
    paddingVertical: 0,
    paddingBottom: 21,
  },
  error: {
    color: colors.error[400],
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
});

export default styles;
