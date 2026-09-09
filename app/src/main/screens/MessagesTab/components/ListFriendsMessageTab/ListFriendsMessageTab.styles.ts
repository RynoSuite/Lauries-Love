import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const styles = StyleSheet.create({
  mainListContainer: {
    paddingHorizontal: 16,
  },
  mainList: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  titleMainList: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 18,
    lineHeight: 24,
    color: colors.heading,
    paddingBottom: 24,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  avatarContainer: {
    width: 47,
    height: 47,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarLetterContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 18,
    lineHeight: 24,
    color: colors.white,
  },
  userName: {
    flex: 1,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.heading,
  },
  checkboxContainer: {
    backgroundColor: colors.transparent,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: colors.lineStrong,
  },
  checkboxContainerSelected: {
    backgroundColor: colors.magenta,
    borderColor: colors.magenta,
  },
  checkboxContainerFriends: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    backgroundColor: colors.surface2,
    borderColor: colors.line,
    borderRadius: 50,
  },
  checkboxContainerSelectedFriends: {
    backgroundColor: colors.line,
    borderColor: colors.line,
  },
  textSelectedAdd: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
  textSelected: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.muted,
  },
  checkHide: {
    width: 16,
    height: 16,
  },
  separatorContainer: {
    paddingLeft: 56,
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: colors.line,
  },
  titleEmptyList: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.heading,
  },
});

export default styles;
