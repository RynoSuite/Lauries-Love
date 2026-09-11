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
  list: {
    paddingBottom: 40,
  },

  hero: {
    minHeight: 220,
    justifyContent: 'flex-end',
    backgroundColor: colors.surface,
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
    position: 'absolute',
    top: 52,
    left: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: `${colors.ground}99`,
  },
  heroText: {
    padding: 16,
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
  // Leaving is deliberately the quieter control of the two.
  leaveButton: {
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  leaveText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 15,
    color: colors.body,
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
});

export default styles;
