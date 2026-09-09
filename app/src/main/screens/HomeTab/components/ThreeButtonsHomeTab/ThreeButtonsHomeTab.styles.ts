import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 16,
    lineHeight: 24,
    color: colors.faint,
  },
  buttonTextSelected: {
    // Magenta as TYPE, not the #911766 fill: that scores 1.82:1 on this
    // ground and is unreadable. magentaText is 5.14:1 and passes AA.
    color: colors.magentaText,
  },
  lineContainer: {
    width: '100%',
    height: 2,
    backgroundColor: colors.line,
  },
  line: {
    height: 2,
  },
  gradient: {
    flex: 1,
  },
});

export default styles;
