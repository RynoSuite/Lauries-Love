import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_HANKEN_GROTESK_400, FONT_RALEWAY_500 } from 'styles/fonts';

const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingTop: 120,
    paddingHorizontal: 16,
    paddingBottom: 20,
    height: HEIGHT * 0.8,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 13,
    paddingRight: 16,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.faint,
  },
  linearGradient: {
    flex: 1,
    borderRadius: 12,
    height: 53,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linearGradientText: {
    color: colors.white,
    fontFamily: FONT_HANKEN_GROTESK_400,
  },
});

export default styles;
