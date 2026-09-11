import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_HANKEN_GROTESK_400,
  FONT_RALEWAY_500,
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  mainContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  container: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 18,
    lineHeight: 22,
    color: colors.heading,
    maxWidth: '65%',
    flex: 1,
  },
  headerTime: {
    fontFamily: FONT_HANKEN_GROTESK_400,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
  content: {
    padding: 16,
    backgroundColor: colors.surface,
    paddingBottom: 60,
  },
  contentText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  searchTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    gap: 16,
  },
  searchHeaderText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
    lineHeight: 34,
    flex: 1,
  },
  searchReadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchReadMoreText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    color: colors.heading,
    lineHeight: 20,
  },
  withImageContainer: {
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    backgroundColor: colors.surface,
    padding: 16,
    paddingTop: 19,
    paddingBottom: 40,
    gap: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: HEIGHT > 1000 ? 250 : 150,
    overflow: 'hidden',
    borderRadius: 8,
  },
  imageContainer: {
    borderRadius: 8,
  },
  withImageContent: {
    gap: 12,
    marginTop: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  withImageHeaderText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
    lineHeight: 28,
    flex: 1,
  },
  withImageFooter: {
    bottom: 5,
  },
  // Search results. The old layout was the post's opening line at 24pt with
  // a link beside it; this is a compact card that says who, when, where and
  // how much conversation there was.
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    gap: 10,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchWho: {
    flex: 1,
    gap: 1,
  },
  searchName: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    lineHeight: 20,
    color: colors.heading,
  },
  searchGroup: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.magentaText,
  },
  searchDate: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.faint,
  },
  searchBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  searchText: {
    flex: 1,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.body,
  },
  // A thumbnail rather than the full image: in a list of results the picture
  // is a cue, not the content.
  searchThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface2,
  },
  searchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  searchCount: {
    marginRight: 10,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 12,
    color: colors.muted,
  },
});

export default styles;
