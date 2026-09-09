import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 18,
  },
  input: {
    flex: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 18,
    color: colors.heading,
    paddingVertical: 15,
  },
  error: {
    color: colors.error[400],
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: 350,
  },
  inputContainerSearch: {
    gap: 15,
    paddingLeft: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  item: {
    backgroundColor: colors.surface2,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});

export default styles;
