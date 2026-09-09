import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.black,
    opacity: 0.4,
  },
  container: {
    width: WIDTH - 32,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
  },
  titles: {
    gap: 20,
  },
  title: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 20,
    lineHeight: 24,
    color: colors.heading,
    textAlign: 'center',
  },
  subTitle: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleButton: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.heading,
  },
  buttonDelete: {
    backgroundColor: colors.danger,
  },
  titleButtonDelete: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white,
  },
});

export default styles;
