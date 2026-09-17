/**
 * US ZIP code → state, with a coordinate sanity check.
 *
 * The legacy platform never stored `state`: it is NULL for all 2,221 members.
 * It did store `zip_code` for 2,173 of them, and ZIP codes are allocated in
 * contiguous ranges by state, so the state is a LOOKUP rather than a guess.
 *
 * The check matters because a ZIP can be mistyped. Every member also carries
 * coordinates, so a derived state is only accepted when the member's point
 * falls inside that state's bounding box. A box is not the state's real
 * outline — it over-accepts near corners and borders — so this catches gross
 * disagreement (a ZIP saying Oregon for a point in Florida) rather than
 * proving containment. Anything that disagrees is left blank and reported,
 * because a wrong state looks like an answer.
 */

// Ranges are inclusive, on the numeric ZIP. Sourced from the USPS state
// allocation; states with several disjoint ranges appear more than once.
const ZIP_RANGES = [
  [501, 544, 'NY'], [601, 988, 'PR'], [1001, 2791, 'MA'], [2801, 2940, 'RI'],
  [3031, 3897, 'NH'], [3901, 4992, 'ME'], [5001, 5907, 'VT'], [6001, 6928, 'CT'],
  [7001, 8989, 'NJ'], [10001, 14975, 'NY'], [15001, 19640, 'PA'], [19701, 19980, 'DE'],
  [20001, 20599, 'DC'], [20601, 21930, 'MD'], [22001, 24658, 'VA'], [24701, 26886, 'WV'],
  [27006, 28909, 'NC'], [29001, 29948, 'SC'], [30002, 31999, 'GA'], [32003, 34997, 'FL'],
  [35004, 36925, 'AL'], [37010, 38589, 'TN'], [38601, 39776, 'MS'], [40003, 42788, 'KY'],
  [43001, 45999, 'OH'], [46001, 47997, 'IN'], [48001, 49971, 'MI'], [50001, 52809, 'IA'],
  [53001, 54990, 'WI'], [55001, 56763, 'MN'], [57001, 57799, 'SD'], [58001, 58856, 'ND'],
  [59001, 59937, 'MT'], [60001, 62999, 'IL'], [63001, 65899, 'MO'], [66002, 67954, 'KS'],
  [68001, 69367, 'NE'], [70001, 71497, 'LA'], [71601, 72959, 'AR'], [73001, 73199, 'OK'],
  [73301, 73301, 'TX'], [73401, 74966, 'OK'], [75001, 79999, 'TX'], [80001, 81658, 'CO'],
  [82001, 83128, 'WY'], [83201, 83876, 'ID'], [84001, 84784, 'UT'], [85001, 86556, 'AZ'],
  [87001, 88441, 'NM'], [88510, 88589, 'TX'], [88901, 89883, 'NV'], [90001, 96162, 'CA'],
  [96701, 96898, 'HI'], [97001, 97920, 'OR'], [98001, 99403, 'WA'], [99501, 99950, 'AK'],
];

// [minLat, maxLat, minLon, maxLon]. Deliberately generous — see the note above.
const BOXES = {
  AL: [30.1, 35.1, -88.5, -84.8], AK: [51.0, 71.5, -179.9, -129.0],
  AZ: [31.2, 37.1, -114.9, -108.9], AR: [32.9, 36.6, -94.7, -89.6],
  CA: [32.4, 42.1, -124.5, -114.0], CO: [36.9, 41.1, -109.1, -102.0],
  CT: [40.9, 42.1, -73.8, -71.7], DE: [38.4, 39.9, -75.8, -74.9],
  DC: [38.7, 39.1, -77.2, -76.8], FL: [24.3, 31.1, -87.7, -79.9],
  GA: [30.3, 35.1, -85.7, -80.7], HI: [18.8, 22.3, -160.3, -154.7],
  ID: [41.9, 49.1, -117.3, -110.9], IL: [36.9, 42.6, -91.6, -87.4],
  IN: [37.7, 41.8, -88.2, -84.7], IA: [40.3, 43.6, -96.7, -90.1],
  KS: [36.9, 40.1, -102.1, -94.5], KY: [36.4, 39.2, -89.6, -81.9],
  LA: [28.8, 33.1, -94.1, -88.7], ME: [42.9, 47.6, -71.2, -66.9],
  MD: [37.8, 39.8, -79.5, -74.9], MA: [41.1, 42.9, -73.6, -69.8],
  MI: [41.6, 48.4, -90.5, -82.3], MN: [43.4, 49.5, -97.3, -89.4],
  MS: [30.1, 35.1, -91.7, -88.0], MO: [35.9, 40.7, -95.9, -89.0],
  MT: [44.3, 49.1, -116.1, -104.0], NE: [39.9, 43.1, -104.1, -95.2],
  NV: [34.9, 42.1, -120.1, -113.9], NH: [42.6, 45.4, -72.6, -70.6],
  NJ: [38.8, 41.4, -75.6, -73.8], NM: [31.2, 37.1, -109.1, -102.9],
  NY: [40.4, 45.1, -79.8, -71.8], NC: [33.7, 36.7, -84.4, -75.4],
  ND: [45.8, 49.1, -104.1, -96.5], OH: [38.3, 42.4, -84.9, -80.4],
  OK: [33.5, 37.1, -103.1, -94.3], OR: [41.9, 46.4, -124.7, -116.4],
  PA: [39.6, 42.4, -80.6, -74.6], RI: [41.1, 42.1, -71.9, -71.1],
  SC: [32.0, 35.3, -83.4, -78.4], SD: [42.4, 46.0, -104.1, -96.4],
  TN: [34.9, 36.8, -90.4, -81.6], TX: [25.7, 36.6, -106.7, -93.4],
  UT: [36.9, 42.1, -114.1, -108.9], VT: [42.6, 45.1, -73.5, -71.4],
  VA: [36.4, 39.5, -83.7, -75.1], WA: [45.4, 49.1, -124.9, -116.9],
  WV: [37.1, 40.7, -82.7, -77.6], WI: [42.4, 47.4, -92.9, -86.7],
  WY: [40.9, 45.1, -111.1, -103.9], PR: [17.8, 18.6, -67.3, -65.2],
};

// Coordinates are coarsened to a ~3.5 mile grid before they are stored, and a
// bounding box already over-accepts, so the margin only has to absorb that
// rounding rather than any real uncertainty.
const MARGIN = 0.6;

export function stateFromZip(zip) {
  if (!zip) return null;
  const digits = String(zip).trim().slice(0, 5).replace(/\D/g, '');
  if (digits.length !== 5) return null;
  const n = Number(digits);
  for (const [lo, hi, state] of ZIP_RANGES) if (n >= lo && n <= hi) return state;
  return null;
}

/**
 * Whether a member's stored coordinates can be believed.
 *
 * They frequently cannot. The legacy platform geocoded the CITY NAME with no
 * state — it never stored one — so ambiguous names landed wherever the
 * geocoder looked first: Morgantown KY plotted in West Virginia, Garden City
 * MO on Long Island, Taylorsville KY in Utah. 356 of 2,221 are in the wrong
 * state that way, and another 144 sit at exactly 0,0, in the Atlantic.
 *
 * So the ZIP decides the state, and the coordinates have to agree with it to
 * survive. A member whose point is rejected keeps their city and state and
 * simply does not appear on the map, which is the honest outcome: showing
 * someone in the wrong state is worse than not showing them.
 */
export function coordinatesAreCredible({ zip, latitude, longitude, country }) {
  if (latitude == null || longitude == null) return false;
  // Null Island. Never a real member, always a failed geocode.
  if (latitude === 0 && longitude === 0) return false;

  const state = deriveState({ zip, country }).state;
  if (!state) return true; // No ZIP to check against; nothing to contradict.

  const box = BOXES[state];
  if (!box) return true;

  const [minLat, maxLat, minLon, maxLon] = box;
  return (
    latitude >= minLat - MARGIN &&
    latitude <= maxLat + MARGIN &&
    longitude >= minLon - MARGIN &&
    longitude <= maxLon + MARGIN
  );
}

/**
 * The state, from the ZIP. Coordinates are deliberately NOT consulted — see
 * coordinatesAreCredible() for why they are the less trustworthy field.
 */
export function deriveState({ zip, country }) {
  // The ranges are US-only; a UK postcode would land in them by accident.
  if (country && !['US', 'USA', 'UNITED STATES'].includes(String(country).trim().toUpperCase())) {
    return { state: null, reason: 'non-US country' };
  }

  const state = stateFromZip(zip);
  if (!state) return { state: null, reason: zip ? 'zip outside known ranges' : 'no zip' };
  return { state, reason: 'from zip' };
}
