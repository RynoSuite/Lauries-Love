import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 29,
  },
  footerLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  footerText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 18,
    lineHeight: 22,
    color: colors.heading,
  },
});

export default styles;
