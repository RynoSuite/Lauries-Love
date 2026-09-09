import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    gap: 48,
  },
  userContainer: {
    gap: 12,
    alignItems: 'center',
    paddingTop: 44,
  },
  infoContainer: {
    gap: 4,
  },
  name: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
    lineHeight: 32,
    textAlign: 'center',
  },
  birthday: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 18,
    textAlign: 'center',
  },
  blockedContainer: {
    alignItems: 'center',
    paddingTop: 120,
    gap: 12,
  },
  blockedText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
    lineHeight: 28,
    textAlign: 'center',
  },
  subTitleBlocked: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.heading,
    lineHeight: 18,
    textAlign: 'center',
  },
  buttonUnblock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 40,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  blockUserButton: {
    backgroundColor: colors.transparent,
  },
  labelBlockUserButton: {
    color: colors.danger,
  },
  // BottomSheetCustom
  handleIndicatorStyle: {
    backgroundColor: colors.surface2,
    width: 36,
    display: 'flex',
  },
  containerBottomSheet: {
    gap: 32,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  titleHeader: {
    color: colors.heading,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 20,
    lineHeight: 24,
  },
  buttonHeader: {
    position: 'absolute',
    right: 0,
    top: 0,
    paddingHorizontal: 20,
  },
  content: {
    gap: 24,
    paddingHorizontal: 24,
  },
  blockUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  blockUserText: {
    flex: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    color: colors.muted,
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 16,
  },
});

export default styles;
