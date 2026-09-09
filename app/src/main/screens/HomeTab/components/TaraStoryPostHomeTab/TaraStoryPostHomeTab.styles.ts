import { Dimensions, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';
const HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: HEIGHT > 1000 ? 250 : 150,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    color: colors.heading,
    lineHeight: 34,
  },
  contentText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.body,
    lineHeight: 18,
  },
  sawTitleContainer: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
  },
});

export default styles;
