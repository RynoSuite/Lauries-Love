import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
  FONT_RALEWAY_700,
} from 'styles/fonts';

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
  loading: {
    paddingTop: 40,
  },
  section: {
    gap: 12,
    paddingBottom: 8,
  },
  // Magenta, as on web: it labels the section rather than competing with the
  // group names under it.
  sectionTitle: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    color: colors.magentaText,
  },
  empty: {
    paddingTop: 32,
    textAlign: 'center',
    fontFamily: FONT_RALEWAY_500,
    fontSize: 15,
    color: colors.muted,
  },
  // Quieter than Join: creating a group is the rarer act.
  createButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  createText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    color: colors.body,
  },
});

export default styles;
