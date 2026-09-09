import { StyleSheet } from 'react-native';
import colors from 'styles/colors';

import { FONT_RALEWAY_400, FONT_RALEWAY_500 } from 'styles/fonts';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textInput: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    textAlign: 'center',
    fontFamily: FONT_RALEWAY_400,
    fontSize: 16,
    borderWidth: 1,
    color: colors.heading,
    backgroundColor: colors.surface2,
  },
  separator: {
    fontSize: 16,
    color: colors.heading,
  },
  animatedContainer: {
    position: 'relative',
  },
  errorTextAnimated: {
    width: '100%',
    fontFamily: FONT_RALEWAY_500,
    paddingTop: 10,
    fontSize: 12,
    lineHeight: 14,
    color: colors.error[400],
  },
  errorTextAbsolute: {
    position: 'absolute',
    width: '100%',
    fontFamily: FONT_RALEWAY_500,
    paddingTop: 10,
    fontSize: 12,
    lineHeight: 14,
    color: colors.error[400],
  },
});
