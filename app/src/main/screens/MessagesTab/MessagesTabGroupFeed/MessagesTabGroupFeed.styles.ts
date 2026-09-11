import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

// Same bottom-weighted wash as the cards, so a cover reads the same way in
// the list and on the page it opens.
export const SCRIM = {
  colors: [`${colors.ground}4D`, `${colors.ground}D9`, colors.ground] as const,
  locations: [0, 0.6, 1] as const,
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Matches the community wall. At 40 the last post sat behind the tab bar,
  // and the overscroll that revealed it snapped straight back.
  list: {
    paddingBottom: 180,
  },

  // The arrow row sits at the top and the name at the bottom, both in flow.
  // The arrow used to be absolute at top: 52 — but BackgroundScreen already
  // offsets this screen by the safe area plus 30, so that 52 was added to
  // padding that was already there, and the name's clearance depended on
  // whatever height the cover happened to have.
  hero: {
    minHeight: 190,
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
  },
  // Over the cover rather than above it: the image runs to the top of the
  // screen, so the control has to sit on it.
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: `${colors.ground}99`,
  },
  heroText: {
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 16,
    gap: 4,
  },
  name: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 28,
    lineHeight: 34,
    color: colors.heading,
  },
  members: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 13,
    color: colors.faint,
  },
  description: {
    marginTop: 4,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.body,
  },

  actions: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  joinButton: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 26,
    backgroundColor: colors.magenta,
  },
  joinText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    color: colors.white,
  },
  // Opposite the back arrow, on the cover. It carries the same alert colour
  // as the confirm it opens, so the two read as one action.
  leaveOnHero: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${colors.danger}E6`,
  },
  leaveOnHeroText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 14,
    color: colors.white,
  },

  empty: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  emptyText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.muted,
  },

  confirm: {
    padding: 20,
    gap: 10,
  },
  confirmTitle: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 22,
    color: colors.heading,
  },
  confirmBody: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  confirmCancel: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
  },
  confirmCancelText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    color: colors.heading,
  },
  confirmLeave: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 26,
    backgroundColor: colors.danger,
  },
  confirmLeaveText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    color: colors.white,
  },
  // Faces, overlapping slightly, then a counter. Names here would turn the
  // roster into a block of text competing with the group itself; in the sheet
  // you are reading a list, so the names come back.
  roster: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  rosterFace: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.ground,
  },
  rosterMore: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  rosterMoreText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 12,
    color: colors.body,
  },

  membersSheet: {
    paddingBottom: 24,
  },
  membersTitle: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 22,
    color: colors.heading,
    paddingBottom: 12,
  },
  membersCount: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 14,
    color: colors.faint,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
  },
  memberName: {
    flex: 1,
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    color: colors.heading,
  },
});

export default styles;
