import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flex: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 13,
    lineHeight: 18,
    color: colors.body,
  },
  // Met rules recede: what is left to do should be what stands out.
  labelMet: {
    color: colors.muted,
  },
});

export default styles;
