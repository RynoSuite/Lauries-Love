import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500, FONT_RALEWAY_500 } from 'styles/fonts';

const HEIGH = Dimensions.get('window').height;

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
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
  prefixButton: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
  },
  prefixText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    lineHeight: 19,
    fontFamily: FONT_RALEWAY_500,
    paddingLeft: 13,
    paddingRight: 16,
    color: colors.heading,
  },
  errorText: {
    color: colors.danger,
    marginTop: 4,
    fontSize: 12,
  },
  modalContainer: {
    gap: 20,
    height: HEIGH * 0.8,
    paddingLeft: 12,
    paddingRight: 17,
  },
  headerModal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextModal: {
    flex: 1,
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
    textAlign: 'center',
  },
  listContainer: { gap: 24, paddingBottom: 60 },
  modalText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
});

export default styles;
