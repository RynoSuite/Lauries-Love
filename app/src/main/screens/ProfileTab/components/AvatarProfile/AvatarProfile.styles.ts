import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_700 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    width: 78,
    height: 78,
    position: 'relative',
  },
  bigContainer: {
    width: 135,
    height: 135,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  notImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.magentaPlate,
  },
  text: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 22,
    lineHeight: 26,
    color: colors.magentaText,
  },
  textBig: {
    fontSize: 35,
    lineHeight: 43,
  },
  iconContainer: {
    position: 'absolute',
    padding: 4,
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface2,
    borderWidth: 3.3,
    borderColor: colors.line,
    borderRadius: 100,
  },
});

export default styles;
