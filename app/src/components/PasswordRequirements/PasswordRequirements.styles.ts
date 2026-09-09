import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingTop: 4,
  },
  // A 14px box holding two bars: a tick when the rule is met, a cross when it
  // is not. Colour comes from the bar, so both marks recolour together.
  mark: {
    width: 14,
    height: 14,
  },
  bar: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  tickShort: {
    width: 6,
    left: 1,
    top: 7,
    backgroundColor: colors.successText,
    transform: [{ rotate: '45deg' }],
  },
  tickLong: {
    width: 11,
    left: 3,
    top: 5.5,
    backgroundColor: colors.successText,
    transform: [{ rotate: '-45deg' }],
  },
  crossA: {
    width: 12,
    left: 1,
    top: 6,
    backgroundColor: colors.heading,
    transform: [{ rotate: '45deg' }],
  },
  crossB: {
    width: 12,
    left: 1,
    top: 6,
    backgroundColor: colors.heading,
    transform: [{ rotate: '-45deg' }],
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
