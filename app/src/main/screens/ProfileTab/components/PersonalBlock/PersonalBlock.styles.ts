import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_HANKEN_GROTESK_400,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  titlesInfo: {
    gap: 8,
  },
  titleInfo: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 20,
    lineHeight: 24,
    color: colors.heading,
  },
  subTitleInfo: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
  phoneInfo: {
    fontFamily: FONT_HANKEN_GROTESK_400,
    fontSize: 14,
    lineHeight: 14,
    color: colors.heading,
  },
});

export default styles;
