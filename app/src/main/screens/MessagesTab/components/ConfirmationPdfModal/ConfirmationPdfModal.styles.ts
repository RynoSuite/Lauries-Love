import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  document: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: colors.surface,
  },
  notDocument: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentTitle: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.body,
    fontSize: 20,
    lineHeight: 27,
    textAlign: 'center',
  },
  documentMessage: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.faint,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    padding: 21,
    flexDirection: 'row',
  },
  iconCloseContainer: {
    backgroundColor: colors.line,
    padding: 9,
    borderRadius: 50,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: WIDTH,
    paddingHorizontal: 16,
    gap: 9,
  },
  inputContainer: {
    borderRadius: 19,
    paddingHorizontal: 0,
    paddingLeft: 0,
  },
  input: {
    paddingHorizontal: 11,
    paddingVertical: 11,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface2,
    borderRadius: 8,
  },
  userTitle: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.white,
    fontSize: 16,
    lineHeight: 22,
  },
  buttonSend: {
    paddingHorizontal: 9,
    paddingVertical: 9,
    backgroundColor: colors.magenta,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonSend: {
    transform: [{ rotate: '45deg' }],
    right: 2,
  },
  iconButtonText: {
    transform: [{ rotate: '0deg' }],
  },
  iconButtonSendText: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.white,
    fontSize: 16,
    lineHeight: 22,
  },
});

export default styles;
