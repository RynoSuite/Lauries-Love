import { Platform, StyleSheet } from 'react-native';

import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_700,
} from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
  },
  logoContainer: {
    paddingVertical: 24,
  },
  flatListContainer: {
    height: 384,
  },
  imageWrapper: {
    alignItems: 'center',
    gap: 24,
  },
  titleText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 36,
    lineHeight: 36,
    textAlign: 'center',
    color: colors.heading,
    width: 220,
    paddingTop: 8,
  },
  descriptionText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    width: 325,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 9,
  },
  paginationDot: {
    width: 18,
    height: 6,
    borderRadius: 12,
  },
  buttonWrapper: {
    gap: 8,
    paddingBottom: 24,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loginTextContainer: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  accountText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.heading,
  },
  loginLinkText: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 16,
    textDecorationLine: 'underline',
    color: colors.heading,
  },
});

export default styles;
