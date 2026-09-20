import { StyleSheet, Dimensions } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600, FONT_RALEWAY_700 } from 'styles/fonts';

const { width } = Dimensions.get('window');

// The card is inset from the screen so the two cards behind it can peek out at
// the bottom, which is what makes the deck read as a pile rather than one card
// that changes person.
export const CARD_WIDTH = width - 40;
// Sized so the whole COLUMN fits, not so the card looks good on its own.
//
// Above and below it sit the header, the intro, the hint, the swipe buttons
// and the app's own tab bar. At 0.56 of the screen height the total came to
// more than the screen, the column overflowed, and the buttons were pushed
// down behind the tab bar. That presents as "the icons are cut off" rather
// than "the card is too tall", which is why it is worth saying here: if the
// controls ever disappear again, this number is the first thing to check.
export const CARD_HEIGHT = Math.min(430, Dimensions.get('window').height * 0.46);

// Past this the release commits the swipe; below it the card springs back, so a
// small hesitant drag is not a decision.
export const SWIPE_THRESHOLD = width * 0.28;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 20,
    color: colors.heading,
  },
  intro: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
  },
  introStrong: {
    color: colors.heading,
  },

  // An EXPLICIT height, not flex: 1.
  //
  // The cards are position:absolute so they can stack, which takes them out of
  // flow — meaning they are not clipped or constrained by this container. With
  // flex:1 the card simply drew over whatever was above and below it whenever
  // the available space was shorter than the card, so the intro text and the
  // swipe buttons ended up underneath it. A fixed height makes the column
  // deterministic: the card occupies exactly this much and nothing else moves.
  //
  // The extra 24 is the peek of the two cards stacked behind the top one.
  deck: {
    height: CARD_HEIGHT + 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // Absorbs whatever is left over, so the controls sit toward the bottom on a
  // tall screen and simply tighten up on a short one.
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.magentaPlate,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 40,
    color: colors.magentaText,
  },
  name: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 22,
    color: colors.heading,
    marginTop: 14,
    textAlign: 'center',
  },
  place: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  distance: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.faint,
    marginTop: 2,
  },
  // The reason this person is on top of the pile. It is the line that decides
  // whether someone swipes right, so it gets the brand colour and its own row.
  sharedLine: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    color: colors.magentaText,
    marginTop: 14,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipShared: {
    backgroundColor: colors.magentaPlate,
    borderColor: colors.magentaPlate,
  },
  chipText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.muted,
  },
  chipTextShared: {
    color: colors.magentaText,
  },
  bio: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 13,
    lineHeight: 19,
    color: colors.body,
    marginTop: 16,
    textAlign: 'left',
  },

  // The stamps that fade in as the card is dragged, so the direction is
  // confirmed before the finger lifts.
  stamp: {
    position: 'absolute',
    top: 22,
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stampLike: {
    left: 20,
    borderColor: colors.magentaText,
    transform: [{ rotate: '-14deg' }],
  },
  stampPass: {
    right: 20,
    borderColor: colors.muted,
    transform: [{ rotate: '14deg' }],
  },
  stampText: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 18,
    letterSpacing: 1,
  },
  stampTextLike: { color: colors.magentaText },
  stampTextPass: { color: colors.muted },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    paddingTop: 10,
    paddingBottom: 14,
  },
  controlButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  controlButtonLike: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.magenta,
    borderColor: colors.magenta,
  },
  hint: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.faint,
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 18,
    color: colors.heading,
    marginTop: 14,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.magenta,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginTop: 22,
  },
  primaryButtonText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    color: colors.white,
  },

  // Match celebration
  matchBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  matchCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 26,
    alignItems: 'center',
  },
  matchRipple: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.magentaText,
  },
  matchTitle: {
    fontFamily: FONT_RALEWAY_700,
    fontSize: 22,
    color: colors.heading,
    marginTop: 14,
  },
  matchBody: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  matchSecondary: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.muted,
    paddingVertical: 12,
  },
  errorText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 13,
    color: colors.cinnabar,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});

export default styles;
