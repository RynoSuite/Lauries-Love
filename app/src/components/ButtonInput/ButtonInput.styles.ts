import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 13,
    paddingLeft: 20,
    backgroundColor: colors.surface2,
    borderRadius: 10,
  },
  value: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 18,
  },
});

export default styles;
