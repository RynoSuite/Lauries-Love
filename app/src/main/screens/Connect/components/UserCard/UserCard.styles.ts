import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_HANKEN_GROTESK_700,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const width = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
    padding: 20,
    paddingTop: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  image: {
    width: 49,
    height: 49,
    borderRadius: 49,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    fontFamily: FONT_HANKEN_GROTESK_700,
    fontSize: 18,
    alignSelf: 'center',
    color: colors.heading,
  },
  cityStateContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    maxWidth: 128,
    borderRadius: 20,
    backgroundColor: colors.surface2,
  },
  cityStateText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 15,
    color: colors.muted,
  },
  detailsText: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.faint,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.body,
    maxWidth: width - 128,
  },
  buttonOutlinedContainer: {
    borderRadius: 44,
    height: 44,
    borderWidth: 1,
    borderColor: colors.magenta,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 44,
    height: 44,
    backgroundColor: colors.magenta,
  },
  buttonInnerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 44,
  },
  sendMessageText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.magentaText,
  },
  viewProfileText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    color: colors.white,
  },
  closeButton: {
    position: 'absolute',
    top: -14,
    right: -6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  closeButtonText: {
    color: colors.muted,
    fontSize: 18,
    lineHeight: 20,
  },
});

export default styles;
