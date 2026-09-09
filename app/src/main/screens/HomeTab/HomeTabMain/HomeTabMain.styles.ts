import { Dimensions, Platform, StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
  FONT_RALEWAY_700,
} from 'styles/fonts';

const WIDTH = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    position: 'relative',
    // The approved design is a dark ground. Without this the screen stays
    // white behind the cards.
    backgroundColor: colors.ground,
  },
  contentContainer: {
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 112 : 64,
  },
  screen: {
    flex: 1,
    gap: 10,
    width: WIDTH,
    backgroundColor: colors.ground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
  },
  headerText: {
    flex: 1,
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 32,
    color: colors.heading,
    lineHeight: 40,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 16,
    // Matches the space below the row, so the pills sit between the tabs and
    // the feed rather than clinging to the tab underline.
    paddingTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface2,
    borderRadius: 30,
  },
  buttonSelected: {
    backgroundColor: colors.magenta,
  },
  buttonText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  buttonTextSelected: {
    // On the magenta fill, not on the ground: white clears 8.34:1 there.
    color: colors.white,
  },
  listScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 180,
  },
  loadingLine: {
    width: '100%',
    height: 2,
  },
  loaderContainer: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notListContainer: {
    paddingTop: 108,
    paddingBottom: 60,
    alignItems: 'center',
    gap: 20,
  },
  notListTextContainer: {
    gap: 8,
    alignItems: 'center',
  },
  notListText: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 24,
    lineHeight: 28,
    color: colors.heading,
    textAlign: 'center',
  },
  notListSubText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 70,
  },
  buttonAdd: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 60,
    right: 18,
    padding: 13,
    borderRadius: 50,
    backgroundColor: colors.magenta,
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIntercom: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 180 : 130,
    right: 18,
    padding: 13,
    borderRadius: 50,
    backgroundColor: colors.magenta,
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countIntercom: {
    position: 'absolute',
    top: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    width: 20,
    borderRadius: 16,
    backgroundColor: colors.danger,
  },
  unreadIntercom: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
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
