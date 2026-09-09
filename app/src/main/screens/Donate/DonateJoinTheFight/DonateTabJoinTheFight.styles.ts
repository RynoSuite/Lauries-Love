import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_BEHIND_THE_NINETIES_500, FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';


const styles = StyleSheet.create({
  container: {
    position: 'relative',
    gap: 32,
    paddingHorizontal: 16,
  },
  contentContainer: {
    gap: 30,
  },
  bannerContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  banner: {
    flex: 1,
    height: 200,
    padding: 20,
    gap: 16,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  bannerTitle: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    lineHeight: 28,
  },
  textContainer: {
    gap: 16,
    paddingBottom: 30,
  },
  title: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 20,
    lineHeight: 24,
  },
  text: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 16,
    lineHeight: 22,
  },
  tag: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 4,
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: colors.heading,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default styles;
