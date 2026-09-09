import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500, FONT_HANKEN_GROTESK_700, FONT_RALEWAY_500 } from 'styles/fonts';

const HEIGHT = Dimensions.get('window').height;
const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  imageRef: {
    flex: 1,
    width: WIDTH,
    height: HEIGHT,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flex: 1,
    height: HEIGHT,
    gap: 16,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    textAlign: 'center',
    color: colors.heading,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButtonHide: {
    opacity: 0,
  },
  amountContainer: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONT_RALEWAY_500,
    color: colors.muted,
  },
  amount: {
    fontSize: 52,
    lineHeight: 64,
    fontFamily: FONT_HANKEN_GROTESK_700,
    color: colors.heading,
  },
  amountCents: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: FONT_HANKEN_GROTESK_700,
    color: colors.heading,
  },
  screenshotLoader: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

export default styles;
