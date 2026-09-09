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
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: "center",
    gap: 12,
  },
  image: {
    width: 34,
    height: 34,
    borderRadius: 34,
  },
  textContainer: {
    maxWidth: 117,
  },
  fullNameText: {
    fontFamily: FONT_RALEWAY_700,
    color: colors.heading,
  },
  requestText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.heading,
  },
  timeText: {
    fontFamily: FONT_HANKEN_GROTESK_400,
    color: colors.faint,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface2,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: colors.line,
  },
  confirmText: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.heading,
  },
  deleteText: {
    fontFamily: FONT_RALEWAY_500,
    color: colors.muted,
  },
});

export default styles;
