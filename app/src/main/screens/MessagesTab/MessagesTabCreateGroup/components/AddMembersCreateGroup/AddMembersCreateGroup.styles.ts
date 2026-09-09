import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: WIDTH,
    gap: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  search: {
    flex: 1,
    borderRadius: 28,
  },
  cancel: {
    paddingLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    lineHeight: 20,
    color: colors.heading,
  },
  lists: {
    gap: 12,
    paddingBottom: 40,
  },
  selectedMembersContainer: {
    paddingHorizontal: 16,
  },
  groupNameContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
    gap: 12,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface2,
    opacity: 0.3,
  },
  listMembers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  member: {
    position: 'relative',
    width: 74,
    alignItems: 'center',
    gap: 4,
  },
  memberImageContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    width: 47,
    height: 47,
  },
  memberImage: {
    width: '100%',
    height: '100%',
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
  removeMember: {
    position: 'absolute',
    top: 2,
    right: 6,
    backgroundColor: colors.neutral[600],
    borderRadius: 50,
    padding: 4,
  },
  memberName: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
});

export default styles;
