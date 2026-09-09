import colors from 'styles/colors';

/**
 * Google Maps styling for the Connect map, in the brand's greens.
 *
 * Off-the-shelf Google tiles read as "a Google map with our pins on it". This
 * takes the map down to the same Deepwater/Harbor ground the rest of the app
 * uses, so the pins are the only bright thing on screen — which is the point
 * of the page.
 *
 * ANDROID ONLY. iOS runs Apple Maps here (the Google iOS key in native code is
 * a placeholder), and Apple Maps cannot be styled — it takes
 * userInterfaceStyle="dark" and nothing more. Full parity would mean wiring a
 * real Google Maps iOS key natively, or overlaying raster tiles.
 */
export const MAP_STYLE_BRAND = [
  // Everything off by default, then put back only what helps someone place
  // themselves: land, water, roads, and place names.
  { elementType: 'geometry', stylers: [{ color: colors.deepwater }] },
  { elementType: 'labels.text.fill', stylers: [{ color: colors.muted }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: colors.ground }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },

  // Water reads darkest, so coastlines stay legible against the land.
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: colors.ground }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: colors.faint }],
  },

  // Parks a touch lighter than the ground: enough to hint at green space
  // without competing with the pins.
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0D3A3D' }],
  },
  // Every other point of interest off. Restaurants and shops are noise on a
  // map whose only job is showing where members are.
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  // Roads as structure, not content: visible enough to orient by, dim enough
  // to recede.
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#0E383C' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: colors.faint }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#14494E' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },

  // Administrative boundaries carry the shape of a state or country at the
  // zoom levels where the clusters are counts rather than people.
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: colors.lineStrong }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: colors.body }],
  },
  {
    featureType: 'administrative.land_parcel',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry',
    stylers: [{ color: '#0B3134' }],
  },
];

export default MAP_STYLE_BRAND;
