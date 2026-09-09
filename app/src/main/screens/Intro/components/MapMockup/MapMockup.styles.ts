import { StyleSheet } from 'react-native';
import colors from 'styles/colors';
import {
  FONT_BEHIND_THE_NINETIES_500,
  FONT_RALEWAY_500,
  FONT_RALEWAY_600,
} from 'styles/fonts';

import { GLASS_EDGE_SOFT, GLASS_FILL, PAD } from '../glass';

const ROAD = `${colors.white}12`;
const ROAD_MINOR = `${colors.white}0A`;
const PIN_EDGE = `${colors.white}59`;

const sheet = StyleSheet.create({
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
  // The locate control: a ring with a dot in it, the universal "centre on me".
  locate: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GLASS_FILL,
    borderWidth: 1,
    borderColor: GLASS_EDGE_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.2,
    borderColor: colors.heading,
  },
  locateDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.heading,
  },

  filters: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 9,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 11,
    backgroundColor: GLASS_FILL,
  },
  chipOn: {
    backgroundColor: colors.magenta,
  },
  chipText: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 9,
    color: colors.muted,
  },
  chipTextOn: {
    fontFamily: FONT_RALEWAY_600,
    color: colors.white,
  },

  // The map bleeds to the edges of the device, as it does on the real screen.
  canvas: {
    flex: 1,
    marginTop: 9,
    marginHorizontal: -PAD,
    backgroundColor: `${colors.surface}99`,
    overflow: 'hidden',
  },
  tiles: {
    ...StyleSheet.absoluteFillObject,
  },

  // Landmarks, so the tiles read as somewhere rather than as a grid. The real
  // map inverts OpenStreetMap onto the dark ground; at this size that comes
  // out as pale streets over deep teal, which is cheaper to draw than to load.
  water: {
    position: 'absolute',
    left: '-16%',
    top: '-12%',
    width: '58%',
    height: '44%',
    borderRadius: 40,
    backgroundColor: `${colors.deepwater}66`,
  },
  park: {
    position: 'absolute',
    left: '62%',
    top: '60%',
    width: '48%',
    height: '44%',
    borderRadius: 24,
    backgroundColor: `${colors.successText}14`,
  },

  road0: { position: 'absolute', left: '-10%', top: '31%', width: '120%', height: 1.5, backgroundColor: ROAD },
  road1: { position: 'absolute', left: '-10%', top: '64%', width: '120%', height: 1, backgroundColor: ROAD_MINOR },
  road2: { position: 'absolute', left: '33%', top: '-10%', width: 1.5, height: '120%', backgroundColor: ROAD },
  road3: { position: 'absolute', left: '71%', top: '-10%', width: 1, height: '120%', backgroundColor: ROAD_MINOR },
  road4: {
    position: 'absolute',
    left: '-20%',
    top: '52%',
    width: '140%',
    height: 1.2,
    backgroundColor: ROAD,
    transform: [{ rotate: '-27deg' }],
  },
  road5: {
    position: 'absolute',
    left: '-14%',
    top: '16%',
    width: '130%',
    height: 1,
    backgroundColor: ROAD_MINOR,
    transform: [{ rotate: '19deg' }],
  },

  m0: { position: 'absolute', left: '15%', top: '18%' },
  m1: { position: 'absolute', left: '66%', top: '12%' },
  m2: { position: 'absolute', left: '37%', top: '39%' },
  m3: { position: 'absolute', left: '78%', top: '54%' },
  m4: { position: 'absolute', left: '17%', top: '61%' },
  m5: { position: 'absolute', left: '57%', top: '73%' },

  pin: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.magentaText,
    borderWidth: 1.5,
    borderColor: PIN_EDGE,
  },
  // A cluster badge, as leaflet.markercluster draws it on the real map.
  cluster: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.magenta,
    borderWidth: 2,
    borderColor: colors.magentaText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterFaded: {
    opacity: 0.16,
  },
  clusterText: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 9,
    color: colors.white,
  },
  // Where the cluster's members land once it opens.
  split1: { position: 'absolute', left: -11, top: -7 },
  split2: { position: 'absolute', left: 18, top: -2 },
  split3: { position: 'absolute', left: 4, top: 18 },

  // The viewer's own position: a dot inside an accuracy ring, never a precise
  // point. Member coordinates are rounded to a ~3.5 mile grid before they are
  // stored, and the mockup should not imply otherwise.
  mePosition: {
    position: 'absolute',
    left: '43%',
    top: '84%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meRing: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.successText,
  },
  meHalo: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: `${colors.successText}33`,
  },
  meDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.successText,
    borderWidth: 1.2,
    borderColor: colors.ground,
  },

  // The member popup, in the shape the real map uses: name in magenta, one
  // line of detail under it.
  popup: {
    position: 'absolute',
    left: '12%',
    top: '4%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${colors.surface2}F2`,
    borderWidth: 1,
    borderColor: GLASS_EDGE_SOFT,
  },
  popupAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.magentaPlate,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupInitial: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 9,
    color: colors.magentaText,
  },
  popupText: {
    gap: 1,
  },
  popupName: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 10,
    color: colors.magentaText,
  },
  popupDetail: {
    fontFamily: FONT_RALEWAY_500,
    fontSize: 8,
    color: colors.muted,
  },
  // The little pointer down to the cluster it belongs to.
  popupTail: {
    position: 'absolute',
    left: 38,
    bottom: -4,
    width: 8,
    height: 8,
    backgroundColor: `${colors.surface2}F2`,
    transform: [{ rotate: '45deg' }],
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  footerCount: {
    fontFamily: FONT_RALEWAY_600,
    fontSize: 9,
    color: colors.body,
  },
});

// Position plus how many members sit under it. The one with a count above 1 is
// the cluster that breaks apart when the map zooms.
export const MARKERS = [
  { at: sheet.m0, count: 1 },
  { at: sheet.m1, count: 1 },
  { at: sheet.m2, count: 12 },
  { at: sheet.m3, count: 1 },
  { at: sheet.m4, count: 1 },
  { at: sheet.m5, count: 1 },
];

export const ROADS = [
  sheet.road0,
  sheet.road1,
  sheet.road2,
  sheet.road3,
  sheet.road4,
  sheet.road5,
];

export default sheet;
