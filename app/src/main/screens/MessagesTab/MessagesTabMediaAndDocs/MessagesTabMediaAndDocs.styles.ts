import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_HANKEN_GROTESK_400,
  FONT_RALEWAY_500,
} from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonsContainer: {
    paddingVertical: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: WIDTH,
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 2,
    padding: 2,
  },
  docContentContainer: {
    width: WIDTH,
    flexDirection: 'column',
    gap: 8,
    paddingHorizontal: 16,
  },
  docContainer: {
    gap: 8,
  },
  dateText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  emptyContainer: {
    width: WIDTH,
    height: HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  emptyTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    lineHeight: 28,
    color: colors.heading,
  },
  emptySubText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
  sizeElement: {
    width: WIDTH / 3 - 2 * 2,
    height: WIDTH / 3 - 2 * 2,
  },
  buttonDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderColor: colors.quaternary[200],
    borderWidth: 1,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  docTitles: {
    gap: 8,
  },
  titleDoc: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 18,
    lineHeight: 22,
    color: colors.body,
  },
  subTitleDoc: {
    fontFamily: FONT_HANKEN_GROTESK_400,
    fontSize: 16,
    lineHeight: 22,
    color: colors.faint,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: WIDTH,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueChalk50,
  },
});

export default styles;
