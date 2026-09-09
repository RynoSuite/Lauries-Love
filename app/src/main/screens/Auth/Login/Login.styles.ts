import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_700,
} from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: WIDTH,
    height: HEIGHT > 1000 ? 400 : 300,
  },
  containerGradient: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  bottomSheet: {
    top: -70,
    width: WIDTH,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: HEIGHT * 0.74,
    // Was white. The approved design is a dark ground, and a white sheet on
    // it reads as an unstyled system screen rather than the product.
    backgroundColor: colors.surface,
    gap: 24,
  },
  title: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 36,
    lineHeight: 48,
    color: colors.heading,
    paddingHorizontal: 16,
  },
  body: {
    gap: 20,
    paddingHorizontal: 16,
  },
  inputs: {
    gap: 12,
  },
  titleForgotPassword: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.magentaText,
  },
  submitContainer: {
    gap: 12,
  },
  subTitle: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  titleCreateAccount: {
    fontFamily: FONT_RALEWAY_700,
    color: colors.magentaText,
    textDecorationLine: 'underline',
  },
});

export default styles;
