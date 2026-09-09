import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 16,
  },
  titleHeader: {
    flex: 1,
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 32,
    lineHeight: 40,
    color: colors.heading,
  },
  buttonHeader: {
    paddingHorizontal: 16,
  },
  // The same magenta disc the donate header uses, so a header action looks
  // like a header action wherever it appears.
  qrPlate: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.magenta,
  },
});

export default styles;
