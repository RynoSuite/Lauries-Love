import { StyleSheet } from 'react-native';

import colors from 'styles/colors';
import {
  FONT_HANKEN_GROTESK_400,
  FONT_RALEWAY_500,
  FONT_RALEWAY_700,
} from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  image: {
    width: 34,
    height: 34,
    borderRadius: 34,
  },
  nameAndType: {
    flexDirection: 'row',
    gap: 4,
  },
  fullNameText: {
    fontFamily: FONT_RALEWAY_700,
    maxWidth: 96,
    color: colors.heading,
  },
  typeText: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.heading,
  },
  timeText: {
    fontFamily: FONT_HANKEN_GROTESK_400,
    color: colors.faint,
  },
  messageContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  messageText: {
    maxWidth: 240,
    fontFamily: FONT_RALEWAY_500,
    color: colors.heading,
  },
});

export default styles;
