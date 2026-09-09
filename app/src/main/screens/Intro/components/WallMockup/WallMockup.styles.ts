import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

import { GLASS_EDGE_SOFT, GLASS_FILL, INNER } from '../glass';

// Equal thirds, labels centred in them. The underline is a one-unit sliver
// scaled to the label above it, so both of its animations stay native.
const SLOT = INNER / 3;
export const TABS = {
  centers: [SLOT * 0.5, SLOT * 1.5, SLOT * 2.5],
  widths: [52, 44, 44],
};

/**
 * Two rounded lobes rotated into a heart. Sized on demand because the mockup
 * uses it at three scales: the post's own heart, and the smaller ones that
 * drift off it when a reaction lands.
 */
export const heartLobe = (size: number, color: string) => ({
  base: {
    position: 'absolute' as const,
    top: 0,
    width: size * 0.62,
    height: size * 0.92,
    borderTopLeftRadius: size * 0.31,
    borderTopRightRadius: size * 0.31,
    backgroundColor: color,
  },
  left: { left: size * 0.06, transform: [{ rotate: '-45deg' }] },
  right: { right: size * 0.06, transform: [{ rotate: '45deg' }] },
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: FONT_BEHIND_THE_NINETIES_500,
    fontSize: 16,
    color: colors.heading,
  },
  // A bell drawn from three shapes rather than pulled in as an icon, so the
  // mockup carries no dependency on the icon set it is depicting.
  bell: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_EDGE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDome: {
    width: 8,
    height: 7,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    borderColor: colors.heading,
  },
  bellClapper: {
    width: 4,
    height: 1.2,
    marginTop: 1,
    backgroundColor: colors.heading,
  },
  bellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.magentaText,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    marginTop: 9,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_EDGE_SOFT,
  },
  searchGlass: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: colors.muted,
  },
  searchHandle: {
    width: 3,
    height: 1.2,
    marginLeft: 1,
    marginTop: 4,
    backgroundColor: colors.muted,
    transform: [{ rotate: '45deg' }],
  },
  searchText: {
    marginLeft: 7,
    fontFamily: FONT_RALEWAY_500,
    fontSize: 10,
    color: colors.faint,
  },

  tabs: {
    flexDirection: 'row',
    marginTop: 11,
    paddingBottom: 6,
  },
  tabSlot: {
    width: SLOT,
    alignItems: 'center',
  },
  tabActive: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 11,
    color: colors.magentaText,
  },
  tab: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 11,
    color: colors.faint,
  },
  // Gilt, as on the real screen: the one place the metal appears.
  tabUnderline: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 1,
    height: 2,
    backgroundColor: colors.gilt,
  },
  tabsRule: {
    height: 1,
    backgroundColor: GLASS_EDGE_SOFT,
  },

  // The wall's whole promise is that somebody else is awake, so the mockup
  // says so — and the line changes with the tab.
  presence: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
    backgroundColor: colors.successText,
  },
  presenceText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 9,
    color: colors.muted,
  },

  card: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: GLASS_FILL,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: GLASS_EDGE_SOFT,
  },
  avatar: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.magenta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Real avatars are not all one colour. Alternating keeps a two-post feed
  // from looking like one person talking to themselves.
  avatarAlt: {
    backgroundColor: colors.magentaPlate,
  },
  avatarText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 10,
    color: colors.white,
  },
  avatarTextAlt: {
    color: colors.magentaText,
  },
  cardWho: {
    flex: 1,
  },
  cardName: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 10,
    color: colors.heading,
  },
  // The room a group post was written in — the Groups tab's only tell, and
  // the reason the same card can serve all three filters.
  cardGroup: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 8,
    color: colors.magentaText,
  },
  cardMeta: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 9,
    color: colors.faint,
  },
  cardBody: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 7,
  },
  cardText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 10,
    lineHeight: 14,
    minHeight: 28,
    color: colors.body,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 5,
  },
  // The drifting hearts start on top of the real one and rise out of the card.
  // Absolute so they never widen the footer as they travel.
  driftLayer: {
    position: 'absolute',
    right: 44,
    bottom: 0,
  },
  driftTwo: {
    position: 'absolute',
    right: -6,
    bottom: 0,
  },
  comment: {
    width: 9,
    height: 8,
    marginLeft: 5,
    borderRadius: 2,
    borderWidth: 1.2,
    borderColor: colors.faint,
  },
  count: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 9,
    color: colors.muted,
  },
  countOn: {
    color: colors.magentaText,
  },

});

export default styles;
