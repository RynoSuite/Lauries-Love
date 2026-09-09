import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
    gap: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    paddingRight: 10,
  },
  backButtonHide: {
    opacity: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 28,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 10,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 28,
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    paddingRight: 90,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.ground,
  },
  bottomBarText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.heading,
    lineHeight: 14,
  },
  bottomBarRight: {
    padding: 11,
    borderRadius: 50,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  contentContainerStyle: {
    gap: 28,
    paddingBottom: 40,
  },
  historyItem: {
    gap: 28,
  },
  historyItemTitle: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 20,
    lineHeight: 22,
    color: colors.heading,
  },
  historyItemContent: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  showVideoContainer: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
  },
  videoContainer: {
    height: 250,
    width: '100%',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  videoStyle: {
    height: '100%',
    flex: 1,
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 0,
    paddingHorizontal: 32,
    paddingVertical: 26,
  },
});

export default styles;
