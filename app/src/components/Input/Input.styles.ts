import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    lineHeight: 19,
    fontFamily: FONT_RALEWAY_500,
    paddingLeft: 13,
    paddingRight: 16,
    // Without this the typed text is the platform default — black, on a dark
    // field. This one component backs every form in the app.
    color: colors.heading,
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
  passwordIcon: {
    height: 'auto',
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
});

export default styles;
