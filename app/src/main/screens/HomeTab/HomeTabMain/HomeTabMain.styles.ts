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
  // The one action on the Groups tab, so it is the app's action colour
  // rather than another quiet pill beside Trending and New.
  exploreButton: {
    marginLeft: 'auto',
    // The row has no alignItems, so children stretch to the tallest pill.
    // This button was shorter than Trending and New, so it stretched and its
    // label sat at the top with the slack underneath.
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.magenta,
  },
  exploreButtonText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 13,
    color: colors.white,
  },
});

export default styles;
