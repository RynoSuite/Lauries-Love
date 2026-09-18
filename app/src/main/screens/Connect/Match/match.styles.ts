import { StyleSheet, Dimensions } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600, FONT_RALEWAY_700 } from 'styles/fonts';

const { width } = Dimensions.get('window');

// The card is inset from the screen so the two cards behind it can peek out at
// the bottom, which is what makes the deck read as a pile rather than one card
// that changes person.
export const CARD_WIDTH = width - 40;
export const CARD_HEIGHT = Math.min(520, Dimensions.get('window').height * 0.62);

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
    paddingTop: 8,
    paddingBottom: 4,
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
    color: colors.seaMist,
  },
  intro: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  introStrong: {
    color: colors.seaMist,
  },

  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.seaMist,
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
    paddingBottom: 6,
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
    paddingTop: 12,
    paddingBottom: 18,
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
    color: colors.seaMist,
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
    color: colors.seaMist,
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
