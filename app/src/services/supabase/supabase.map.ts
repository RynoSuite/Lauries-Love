import { supabase } from './client';

/**
 * Dots for the map, filtered in the database.
 *
 * The map used to draw itself from users_in_bbox, which returns whole
 * profiles, is capped at 1000 rows with no ORDER BY, and was asked for 500.
 * With 3,979 members carrying coordinates, a country-wide viewport returned an
 * arbitrary 500 of them — arbitrary meaning disk order — so whole states were
 * missing until you zoomed in far enough for the locals to fit under the cap.
 *
 * Raising the cap is the wrong fix. Measured on staging, a whole profile is
 * 478 bytes, so every member in a country-wide box is 1.81 MB, refetched on
 * every pan. The same rows as id + latitude + longitude are 315 KB.
 *
 * The filters moved into the query with it, because filtering can only be
 * correct if it happens BEFORE the limit — filtering an arbitrary 500 of 3,979
 * in memory was wrong twice over.
 *
 * Whole profiles are still right for the card that opens on a tap, which is
 * one member, fetched then.
 */
export type MapPoint = { id: string; latitude: number; longitude: number };

export type MapPointFilters = {
  /** value_definitions.description, as FiltersModal already holds them. */
  roles?: string[];
  ages?: string[];
  genders?: string[];
  diagnosisTypes?: string[];
  diagnosisYears?: string[];
  /** Codes AND names: the column holds both "US" and "United States". */
  countries?: string[];
  city?: string;
};

// An empty array means "no filter", so it is sent as null rather than [] —
// the function treats both the same, but null says what is meant.
const orNull = (xs?: string[]) => (xs && xs.length ? xs : null);

/** One row per state, counted in the database. */
export type StateBubble = {
  label: string;
  member_count: number;
  latitude: number;
  longitude: number;
};

/**
 * How many members are in view, by state.
 *
 * Cheap — about fifty rows — and exact, which individual markers cannot be:
 * PostgREST returns at most 1000 rows per request whatever a function's own
 * limit says (verified as "content-range: 0-999/3971"). So above that, a list
 * of members is necessarily a sample, and only an aggregate can answer "how
 * many members are in Georgia".
 *
 * Each bubble sits at the average of its own state's members, so it always
 * lands among the people it counts — unlike grid clustering, which averaged a
 * cell and put "185" over Mexico.
 */
export async function getMembersByState(
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  filters: MapPointFilters = {},
): Promise<StateBubble[]> {
  const { data, error } = await supabase.rpc('members_by_state', {
    min_lat: bbox.minLat,
    min_lng: bbox.minLng,
    max_lat: bbox.maxLat,
    max_lng: bbox.maxLng,
    p_roles: orNull(filters.roles),
    p_ages: orNull(filters.ages),
    p_genders: orNull(filters.genders),
    p_diagnosis_types: orNull(filters.diagnosisTypes),
    p_diagnosis_years: orNull(filters.diagnosisYears),
    p_countries: orNull(filters.countries),
    p_city: filters.city && filters.city.trim() ? filters.city.trim() : null,
  });
  if (error) throw error;
  return (data ?? []) as StateBubble[];
}

export async function getUserPointsInBbox(
  bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number },
  filters: MapPointFilters = {},
): Promise<MapPoint[]> {
  const { data, error } = await supabase.rpc('users_in_bbox_points', {
    min_lat: bbox.minLat,
    min_lng: bbox.minLng,
    max_lat: bbox.maxLat,
    max_lng: bbox.maxLng,
    p_roles: orNull(filters.roles),
    p_ages: orNull(filters.ages),
    p_genders: orNull(filters.genders),
    p_diagnosis_types: orNull(filters.diagnosisTypes),
    p_diagnosis_years: orNull(filters.diagnosisYears),
    p_countries: orNull(filters.countries),
    p_city: filters.city && filters.city.trim() ? filters.city.trim() : null,
    max_rows: 20000,
  });
  if (error) throw error;
  return (data ?? []) as MapPoint[];
}
