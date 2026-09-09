import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 28,
    color: colors.heading,
  },
  button: {
    paddingHorizontal: 16,
  },
  buttonHide: {
    opacity: 0,
  },
});

export default styles;
