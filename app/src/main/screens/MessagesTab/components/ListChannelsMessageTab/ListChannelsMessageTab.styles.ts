import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const styles = StyleSheet.create({
  mainListContainer: {

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
  loaderContainer: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notGroupContainer: {
    paddingTop: 108,
    paddingBottom: 60,
    alignItems: 'center',
    gap: 20,
  },
  notGroupTextContainer: {
    gap: 8,
    alignItems: 'center',
  },
  notGroupText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    lineHeight: 28,
    color: colors.heading,
    textAlign: 'center',
  },
  notGroupSubText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  buttonCreateGroup: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.magenta,
    padding: 16,
    paddingHorizontal: 20,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCreateGroupText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white,
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
  // Replaces the Join pill: states membership without being a control.
  joinedLabel: {
    color: colors.magentaText,
    fontSize: 13,
    fontWeight: '600',
  },
  buttonJoinGroup: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 4,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 50,
  },
  joined: {
    opacity: 0.5,
  },
  buttonJoinGroupText: {},
  separatorContainer: {
    paddingLeft: 56,
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: colors.line,
  },
});

export default styles;
