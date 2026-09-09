import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_HANKEN_GROTESK_400,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
  FONT_RALEWAY_700,
} from 'styles/fonts';

const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 40,
  },
  titleJoinButton: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
  },
  container: {
    position: 'relative',
    flex: 1,
    paddingTop: 8,
    paddingBottom: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  inputSearchContainer: {
    flex: 1,
    borderRadius: 28,
    gap: 12,
  },
  inputSearch: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 14,
    lineHeight: 18,
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
  listContainer: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoContainerTitle: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 22,
    lineHeight: 28,
    color: colors.heading,
  },
  infoContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  infoTopBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  titlesItem: {
    flex: 1,
    gap: 4,
  },
  titleItem: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.heading,
  },
  subtitleItem: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
  highlight: {
    fontFamily: FONT_RALEWAY_700,
  },
  dateContainer: {
    gap: 5,
    alignItems: 'flex-end',
  },
  dateItem: {
    fontFamily: FONT_HANKEN_GROTESK_400,
    fontSize: 12,
    lineHeight: 14,
    color: colors.heading,
  },
  dataItemIsNew: {
    color: colors.magentaText,
  },
  newMessagesContainer: {
    width: 24,
    height: 24,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.magenta,
  },
  newMessages: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
  },

  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingBottom: 100,
  },
  emptyListContainerNoResults: {
    height: HEIGHT - 200,
  },
  titlesEmptyList: {
    gap: 8,
    paddingHorizontal: 82,
  },
  titleEmptyList: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    lineHeight: 28,
    color: colors.heading,
    textAlign: 'center',
  },
  subtitleEmptyList: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
    textAlign: 'center',
  },
  subtitleEmptyListBold: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
    textAlign: 'center',
  },
  buttonNewChat: {
    position: 'absolute',
    right: 16,
    bottom: 122,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.magenta,
    borderRadius: 40,
  },
  titleButtonNewChat: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white,
  },
  loadingLine: {
    width: '100%',
    height: 2,
  },
  swipeDelete: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.danger,
  },
  swipeDeleteText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default styles;
