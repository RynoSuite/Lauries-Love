import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 21,
    gap: 15,
    paddingLeft: 15,
    borderWidth: 1,
    borderColor: colors.line,
  },
  containerFocus: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderBottomColor: colors.line,
  },
  withClearContainer: {
    paddingRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 18,
    color: colors.heading,
    paddingVertical: 15,
  },
  clearIcon: {
    backgroundColor: colors.surface2,
    padding: 4,
    borderRadius: 50,
  },
});

export default styles;
