import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_600 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  title: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 18,
    lineHeight: 22,
    color: colors.heading,
    marginBottom: 4,
  },
});

export default styles;
