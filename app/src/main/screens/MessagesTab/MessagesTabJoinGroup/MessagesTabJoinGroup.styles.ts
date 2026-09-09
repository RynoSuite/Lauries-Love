import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_700 } from 'styles/fonts';

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  searchContainer: {
    paddingVertical: 12,
    gap: 24,
  },
  inputSearchContainer: {
    borderRadius: 28,
    gap: 12,
  },
  inputSearch: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 14,
    color: colors.heading,
  },
});

export default styles;
