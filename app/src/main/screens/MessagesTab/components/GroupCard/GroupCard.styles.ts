import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500, FONT_RALEWAY_600 } from 'styles/fonts';

// Bottom-weighted, so the text sits in the darkest part of it. An even wash
// would either wash out the photograph or leave the name fighting it.
export const SCRIM = {
  colors: [`${colors.ground}59`, `${colors.ground}CC`, colors.ground] as const,
  locations: [0, 0.55, 1] as const,
};

const styles = StyleSheet.create({
  // A minimum height rather than a fixed one, so a group with no cover still
  // matches the rhythm of the ones that have one.
  card: {
    minHeight: 148,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    justifyContent: 'flex-end',
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
  content: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 16,
    lineHeight: 22,
    color: colors.heading,
  },
  members: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 12,
    color: colors.faint,
  },
  description: {
    marginTop: 4,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 13,
    lineHeight: 18,
    color: colors.body,
  },
  joinPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.magenta,
  },
  joinText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 13,
    color: colors.white,
  },
  // Joined is a state, not an action, so it is a label rather than a button.
  joinedPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  joinedText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 13,
    color: colors.body,
  },
});

export default styles;
