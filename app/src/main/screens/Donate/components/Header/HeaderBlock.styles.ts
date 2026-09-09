import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
} from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  buttonsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  shareButton: {
    padding: 8,
    backgroundColor: colors.magenta,
    borderRadius: 100,
  },
  titleHeader: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 32,
    lineHeight: 40,
    color: colors.heading,
  },
});

export default styles;
