import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    color: colors.heading,
    lineHeight: 20,
  },
});

export default styles;
