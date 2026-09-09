import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.quaternary[200],
  },
  input: {
    flex: 1,
    padding: 15,
    paddingLeft: 13,
    fontFamily: FONT_RALEWAY_500,
    paddingRight: 16,
  },
  containerError: {
    position: 'relative',
  },
  error: {
    width: '100%',
    fontFamily: FONT_RALEWAY_500,
    paddingTop: 10,
    fontSize: 12,
    lineHeight: 14,
    color: colors.error[400],
  },
  errorHide: {
    position: 'absolute',
  },
  buttonRight: {
    height: 'auto',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
});

export default styles;
