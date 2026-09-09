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
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
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
    color: colors.muted,
  },
  buttonTextSelected: {
    color: colors.heading,
  },
  lineContainer: {
    width: '100%',
    height: 2,
    backgroundColor: colors.line,
    marginTop: 8,
  },
  line: {
    height: 2,
  },
  gradient: {
    flex: 1,
  },
});

export default styles;