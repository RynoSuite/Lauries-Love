import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_AUTOGRAPHY_100, FONT_RALEWAY_500 } from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  backgroundButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDTH,
    height: HEIGHT,
  },
  // Above the full-screen back target, or the target would swallow its taps.
  // Positioned where every other screen in the app puts its back arrow.
  back: {
    position: 'absolute',
    top: 8,
    left: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // White, because the code needs a light field to be scanned reliably. The
  // padding is part of that: a QR wants a quiet border around it.
  card: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.magentaText,
  },
  hint: {
    marginTop: -24,
    paddingHorizontal: 40,
    textAlign: 'center',
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  title: {
    fontFamily: FONT_AUTOGRAPHY_100,
    fontSize: 60,
    textAlign: 'center',
    lineHeight: 76,
    letterSpacing: -1.2,
    color: colors.magentaText,
  },
});

export default styles;
