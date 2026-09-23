import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useColorMode } from '../lib/colorMode';
import { useFeatureFlags } from '../lib/featureFlags';
import { PageTitle } from '../components/PageTitle';
import { IconHeartFilled } from '../components/Icons';

// Marker colours, per theme. Leaflet writes these onto the SVG as attributes,
// so they cannot be `var(--c-magenta)` like the rest of the app — they have to
// be resolved here.
//
// The basemap inverts to a dark map on the dark theme and stays light on the
// light one, so the ring flips with it: white separates a pin from dark tiles,
// and ink separates it from pale ones. The fill follows the same logic — the
// bright #F45FAF stop is the one that survives a dark ground, while on a light
// map the deeper #911766 is what reads.
const MARKERS = {
  dark: {
    focus: { color: '#FFFFFF', weight: 3, fillColor: '#F45FAF', fillOpacity: 1 },
    member: { color: '#F45FAF', weight: 2, fillColor: '#911766', fillOpacity: 0.85 },
  },
  light: {
    focus: { color: '#0A2A2D', weight: 3, fillColor: '#911766', fillOpacity: 1 },
    member: { color: '#FFFFFF', weight: 2, fillColor: '#911766', fillOpacity: 0.9 },
  },
} as const;

// Community map.
//
// Loads only the members inside the current viewport via the users_in_bbox
// RPC. Coordinates are deliberately coarsened to roughly a kilometre before
// they ever leave the database, and the RPC returns no email or phone: a map
// of cancer patients is not something to be precise about. Markers therefore
// show an APPROXIMATE area, which the page says out loud.
//
// Filters run over the loaded viewport rather than the whole database, which
// is the honest shape here: you are filtering the people you can see, and the
// viewport is already the primary filter.

// PostgREST returns at most 1000 rows per request, whatever a function's own
// limit says — verified against staging, where a country-wide box reports
// "content-range: 0-999/3971". So above this many members in view, ANY list of
// individuals is a truncated sample, and the map has to aggregate instead.
// That is not a workaround: it is also what the board asked for.
const POINT_LIMIT = 1000;

// One row per state, counted in the database.
type StateBubble = {
  label: string;
  member_count: number;
  latitude: number;
  longitude: number;
};

type Marker = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  latitude: number;
  longitude: number;
  role_id: string | null;
  diagnosis_type_ids: string[] | null;
  age_range: string | null;
  gender: string | null;
  city: string | null;
  state: string | null;
};

type Definition = {
  id: string;
  definition_type: string;
  description: string;
  sort: number;
};

// A sensible view of the continental US, used until we know better.
const US_CENTER: [number, number] = [39.5, -98.35];
const US_ZOOM = 4;
const NEARBY_ZOOM = 9;
// Closer than "near me": you asked for one person, not a region.
const MEMBER_ZOOM = 11;

async function fetchDefinitions(): Promise<Definition[]> {
  const { data } = await supabase
    .from('value_definitions')
    .select('id, definition_type, description, sort')
    .eq('active', true)
    .order('sort');
  return (data ?? []) as Definition[];
}

export type ViewportResult = {
  markers: Marker[];
  states: StateBubble[];
  total: number;
  mode: 'members' | 'states';
};

/**
 * Decides what the map can honestly draw for the current viewport, and loads it.
 *
 * It used to ask users_in_bbox for 500 profiles and draw those. With 3,979
 * members carrying coordinates, a country-wide box returned an arbitrary 500 —
 * arbitrary meaning disk order — so whole states had no pins at all, the count
 * read "500 of 500" because it was reporting the cap back to itself, and the
 * filters ran over that truncated sample.
 *
 * So the count comes first, aggregated in the database, and it decides:
 *
 *   more than POINT_LIMIT in view -> one bubble per state, counted exactly.
 *     Individual markers are not merely slow here, they are impossible: 1000
 *     rows is all PostgREST will return.
 *
 *   at or below           -> every member in view fits in one response, so
 *     individuals are drawn and filtering them client-side is finally correct,
 *     because the set is complete rather than a sample.
 *
 * The threshold is a fact about the transport, not a guessed zoom level, so
 * the map cannot silently start lying again as the community grows.
 */
function ViewportLoader({
  filterArgs,
  onResult,
}: {
  filterArgs: Record<string, unknown>;
  onResult: (r: ViewportResult) => void;
}) {
  // The last box actually fetched, rounded. Opening a popup auto-pans the map
  // by a few pixels, which fires moveend — without this, every tap on a member
  // re-queried the database for a viewport that had barely moved.
  const lastBox = useRef<string>('');

  const load = useCallback(
    async (b: L.LatLngBounds) => {
      const box = {
        min_lat: b.getSouth(),
        min_lng: b.getWest(),
        max_lat: b.getNorth(),
        max_lng: b.getEast(),
      };

      // Two decimals is about a kilometre, and coordinates are already
      // coarsened to roughly that before they leave the database — so a
      // movement smaller than this cannot change the answer.
      const key =
        [box.min_lat, box.min_lng, box.max_lat, box.max_lng]
          .map(n => n.toFixed(2))
          .join(',') + JSON.stringify(filterArgs);
      if (key === lastBox.current) return;
      lastBox.current = key;

      // Unfiltered on purpose: this asks "could individuals be drawn at all",
      // which is a property of the viewport, not of the filters. Deciding on
      // the filtered count would flip the map between bubbles and pins as
      // filters change, which reads as a glitch.
      const { data: allStates } = await supabase.rpc('members_by_state', box);
      const total = (allStates ?? []).reduce(
        (n: number, r: StateBubble) => n + Number(r.member_count),
        0,
      );

      if (total > POINT_LIMIT) {
        const { data: filtered } = await supabase.rpc('members_by_state', {
          ...box,
          ...filterArgs,
        });
        onResult({
          markers: [],
          states: (filtered ?? []) as StateBubble[],
          total,
          mode: 'states',
        });
        return;
      }

      const { data } = await supabase.rpc('users_in_bbox', {
        ...box,
        max_rows: POINT_LIMIT,
      });
      onResult({
        markers: ((data ?? []) as Marker[]).filter(
          (u) => u.latitude != null && u.longitude != null,
        ),
        states: [],
        total,
        mode: 'members',
      });
    },
    [filterArgs, onResult],
  );

  const map = useMapEvents({
    moveend: () => load(map.getBounds()),
  });

  // Reload when the filters change too: in bubble mode the counts themselves
  // are filtered server-side, so a filter change is a data change, not just a
  // different subset of what is already held.
  useEffect(() => {
    load(map.getBounds());
  }, [load, map]);

  return null;
}

// Centres on a specific member when the page was opened from their profile's
// "View on map". Their coordinates arrive as ?lat/?lng.
function FocusMember({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    map.setView([lat, lng], MEMBER_ZOOM);
  }, [map, lat, lng]);
  return null;
}

// Centres the map on the member's own location once, if they allow it.
// Someone opening a "who is near me" map wants to be near themselves; the
// whole-US view answers a question nobody asked.
//
// Skipped entirely when the page was opened on someone: asking to see a member
// and being shown your own neighbourhood is worse than not moving at all, and
// geolocation resolves late enough to yank the map away after it had arrived.
function LocateOnFirstLoad({ onResolved }: { onResolved: (ok: boolean) => void }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !navigator.geolocation) {
      onResolved(false);
      return;
    }
    done.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], NEARBY_ZOOM);
        onResolved(true);
      },
      // Denied or unavailable: stay on the country view rather than nagging.
      () => onResolved(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }, [map, onResolved]);
  return null;
}

// One choice per filter. Nobody looks for "breast cancer OR leukaemia"; they
// look for people like them. Multi-select added a mental model without adding
// a use case.
type Filters = {
  role: string;
  diagnosis: string;
  gender: string;
  ageRange: string;
};

const EMPTY_FILTERS: Filters = { role: '', diagnosis: '', gender: '', ageRange: '' };

const selectClass =
  'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta';

// One row of four selects, always visible. A toggle that expanded a panel
// pushed the map down and hid the controls behind a click, for something
// people want in front of them while they pan.
//
// Defined at module scope on purpose: a component declared inside the render
// is a new type every render, so React remounts it and the select loses focus
// mid-interaction.
function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">Anyone</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MapPage() {
  const { isEnabled } = useFeatureFlags();
  const { mode } = useColorMode();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [states, setStates] = useState<StateBubble[]>([]);
  const [viewTotal, setViewTotal] = useState(0);
  const [mapMode, setMapMode] = useState<'members' | 'states'>('members');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [located, setLocated] = useState<boolean | null>(null);

  // Keeps the SAME array when the data has not actually changed.
  //
  // Opening a member's popup auto-pans the map to fit it, which fires moveend,
  // which reloads the viewport. If that handed React a fresh array every time,
  // MarkerClusterGroup would rebuild from nothing and collapse the cluster the
  // member had just expanded — so tapping a dot inside a cluster closed the
  // cluster, and they had to expand it again for every single member.
  //
  // Identity is what matters to the cluster group, not contents, so an
  // equivalent result must return the previous array unchanged.
  const handleViewport = useCallback((r: ViewportResult) => {
    const sameIds = (a: { id: string }[], b: { id: string }[]) =>
      a.length === b.length && a.every((x, i) => x.id === b[i].id);
    const sameStates = (a: StateBubble[], b: StateBubble[]) =>
      a.length === b.length &&
      a.every(
        (x, i) => x.label === b[i].label && x.member_count === b[i].member_count,
      );

    setMarkers(prev => (sameIds(prev, r.markers) ? prev : r.markers));
    setStates(prev => (sameStates(prev, r.states) ? prev : r.states));
    setViewTotal(r.total);
    setMapMode(r.mode);
  }, []);

  const { data: defs } = useQuery({
    queryKey: ['value-definitions'],
    queryFn: fetchDefinitions,
  });

  const roleOptions = useMemo(
    () => (defs ?? []).filter((d) => d.definition_type === 'USER_ROLE'),
    [defs],
  );
  const diagnosisOptions = useMemo(
    () => (defs ?? []).filter((d) => d.definition_type === 'DIAGNOSIS_TYPE'),
    [defs],
  );

  // Age ranges and genders are free text on the profile rather than a
  // taxonomy, so the options come from whoever is actually on screen. An
  // option nobody matches is a dead end.
  const ageOptions = useMemo(
    () =>
      Array.from(new Set(markers.map((m) => m.age_range).filter(Boolean))).sort() as string[],
    [markers],
  );
  const genderOptions = useMemo(
    () =>
      Array.from(new Set(markers.map((m) => m.gender).filter(Boolean))).sort() as string[],
    [markers],
  );

  const [searchParams] = useSearchParams();
  const focusMemberId = searchParams.get('member');

  // ?lat/?lng come from a member profile's "View on map".
  const focus = useMemo(() => {
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    const member = searchParams.get('member');
    return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
      ? { lat, lng, member }
      : null;
  }, [searchParams]);

  // The focused member, once the viewport load has actually returned them.
  // Until then the pin is drawn from the coordinates in the URL with a
  // placeholder label, so it is on screen from the first frame.
  const focused = useMemo(
    () => (focus?.member ? markers.find((m) => m.id === focus.member) ?? null : null),
    [markers, focus],
  );

  const visible = useMemo(
    () =>
      markers.filter((m) => {
        // The focused member is drawn separately, outside the cluster group.
        if (focusMemberId && m.id === focusMemberId) return false;
        if (filters.role && m.role_id !== filters.role) return false;
        if (filters.diagnosis && !(m.diagnosis_type_ids ?? []).includes(filters.diagnosis))
          return false;
        if (filters.gender && m.gender !== filters.gender) return false;
        if (filters.ageRange && m.age_range !== filters.ageRange) return false;
        return true;
      }),
    [markers, filters, focusMemberId],
  );

  const activeCount = Object.values(filters).filter(Boolean).length;

  // The aggregate filters on DESCRIPTIONS, because that is what the mobile
  // app's filter modal holds and one function serves both. This page selects
  // by definition id, so it translates on the way out.
  const filterArgs = useMemo(() => {
    const describe = (id: string) =>
      (defs ?? []).find((d) => d.id === id)?.description;
    const one = (v?: string) => (v ? [v] : null);
    return {
      p_roles: filters.role ? one(describe(filters.role)) : null,
      p_diagnosis_types: filters.diagnosis ? one(describe(filters.diagnosis)) : null,
      p_genders: one(filters.gender),
      p_ages: one(filters.ageRange),
    };
  }, [filters, defs]);

  // In bubble mode the counts are already filtered in the database, so the
  // total shown is the sum of what is drawn. In member mode the whole viewport
  // fits in one response, so the filtered count is simply what survives.
  const shownCount =
    mapMode === 'states'
      ? states.reduce((n, s) => n + Number(s.member_count), 0)
      : visible.length;

  if (!isEnabled('community_map'))
    return <p className="text-muted">The community map is turned off.</p>;


  return (
    <div>
      {/* The deck lives off the map on purpose: the map answers "who is near
          me", the deck answers "who is like me", and someone scanning pins for
          a person to talk to is exactly who wants the second question. */}
      <PageTitle
        actions={
          <Link
            to="/connect"
            className="flex items-center gap-2 rounded-lg bg-magenta px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi"
          >
            <IconHeartFilled className="h-[18px] w-[18px]" />
            Meet members
          </Link>
        }
      >
        Community map
      </PageTitle>

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Filter
          label="Looking for"
          value={filters.role}
          onChange={(v) => setFilters((f) => ({ ...f, role: v }))}
          options={roleOptions.map((r) => ({ value: r.id, label: r.description }))}
        />
        <Filter
          label="Diagnosis"
          value={filters.diagnosis}
          onChange={(v) => setFilters((f) => ({ ...f, diagnosis: v }))}
          options={diagnosisOptions.map((d) => ({ value: d.id, label: d.description }))}
        />
        <Filter
          label="Gender"
          value={filters.gender}
          onChange={(v) => setFilters((f) => ({ ...f, gender: v }))}
          options={genderOptions.map((g) => ({ value: g, label: g }))}
        />
        <Filter
          label="Age"
          value={filters.ageRange}
          onChange={(v) => setFilters((f) => ({ ...f, ageRange: v }))}
          options={ageOptions.map((a) => ({ value: a, label: a }))}
        />
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          {focus?.member && (
            <>
              Showing{' '}
              <span className="font-semibold text-heading">
                {focused?.display_name || focused?.first_name || 'one member'}
              </span>
              {' · '}
              <Link to="/map" className="text-magenta-text hover:underline">
                Show everyone
              </Link>
              {' · '}
            </>
          )}
          {/* Was "{visible.length} of {markers.length}", which at wide zoom
              read "500 of 500" — the cap reporting itself back. Both numbers
              are now counted in the database over the whole viewport. */}
          Showing <span className="font-semibold text-heading">{shownCount}</span> of{' '}
          <span className="font-semibold text-heading">{viewTotal}</span> member
          {viewTotal === 1 ? '' : 's'} in view
          {mapMode === 'states' && (
            <span className="text-faint"> · grouped by state — zoom in for individuals</span>
          )}
        </span>
        {activeCount > 0 && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="text-magenta-text hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* isolate: Leaflet panes and controls carry z-index values up to 1000,
          which beat the sticky header and painted the map over the account
          menu. A stacking context here keeps all of that contained. */}
      <div
        className="relative isolate overflow-hidden rounded-2xl border border-line"
        style={{ height: '70vh' }}
      >
        <MapContainer
          center={focus ? [focus.lat, focus.lng] : US_CENTER}
          zoom={focus ? MEMBER_ZOOM : US_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Standard OSM raster tiles, darkened on the client by a CSS filter
              on .leaflet-tile-pane (see index.css). Deliberately keyless:
              CARTO's dark basemap now watermarks "API KEY REQUIRED", and
              Stadia/Mapbox also need a registered key. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          {focus ? (
            <FocusMember lat={focus.lat} lng={focus.lng} />
          ) : (
            <LocateOnFirstLoad onResolved={setLocated} />
          )}
          <ViewportLoader filterArgs={filterArgs} onResult={handleViewport} />
          {/* The member you asked to see, drawn OUTSIDE the cluster group with
              a permanent label. Centring alone was not an answer: on a map of
              two thousand pins, "somewhere in this cluster" still does not
              tell you which one is them. Outside the group it can never be
              swallowed by a cluster bubble either. */}
          {focus?.member && (
            <CircleMarker
              center={[
                focused?.latitude ?? focus.lat,
                focused?.longitude ?? focus.lng,
              ]}
              radius={11}
              pathOptions={MARKERS[mode].focus}
            >
              <Tooltip permanent direction="top" offset={[0, -10]}>
                {focused?.display_name || focused?.first_name || 'This member'}
              </Tooltip>
              <Popup>
                <Link
                  to={`/users/${focus.member}`}
                  className="font-semibold text-magenta-text hover:underline"
                >
                  {focused?.display_name || focused?.first_name || 'Member'}
                </Link>
                {(focused?.city || focused?.state) && (
                  <div className="text-xs text-muted">
                    {[focused?.city, focused?.state].filter(Boolean).join(', ')}
                  </div>
                )}
                <div className="text-xs text-faint">Approximate area</div>
              </Popup>
            </CircleMarker>
          )}
          {/* Zoomed out: one bubble per state, counted in the database, placed
              at the average of that state's own members so it always lands
              among the people it counts. The old grid clustering averaged a
              cell instead, which is how "185" ended up over Mexico and "313"
              over the Gulf. Sized by count so the shape of the community reads
              at a glance, and clamped so a big state cannot swallow the map. */}
          {mapMode === 'states' &&
            states.map((s) => (
              <CircleMarker
                key={s.label}
                center={[s.latitude, s.longitude]}
                radius={Math.max(14, Math.min(34, 12 + Math.sqrt(Number(s.member_count)) * 1.6))}
                pathOptions={MARKERS[mode].member}
                eventHandlers={{
                  click: (e) => e.target._map.flyTo([s.latitude, s.longitude], 7),
                }}
              >
                <Tooltip permanent direction="center" className="ll-count">
                  {s.member_count}
                </Tooltip>
                <Popup>
                  <div className="font-semibold text-heading">{s.label}</div>
                  <div className="text-xs text-muted">
                    {s.member_count} member{Number(s.member_count) === 1 ? '' : 's'}
                  </div>
                  <div className="text-xs text-faint">Zoom in to see them individually</div>
                </Popup>
              </CircleMarker>
            ))}

          <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
            {visible.map((m) => (
              <CircleMarker
                key={m.id}
                center={[m.latitude, m.longitude]}
                radius={8}
                pathOptions={MARKERS[mode].member}
              >
                <Popup>
                  <Link
                    to={`/users/${m.id}`}
                    className="font-semibold text-magenta-text hover:underline"
                  >
                    {m.display_name || m.first_name || 'Member'}
                  </Link>
                  {(m.city || m.state) && (
                    <div className="text-xs text-muted">
                      {[m.city, m.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-faint">Approximate area</div>
                </Popup>
              </CircleMarker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <p className="mt-2 text-xs text-faint">
        {visible.length} member{visible.length === 1 ? '' : 's'} in view
        {activeCount > 0 && markers.length !== visible.length
          ? ` (filtered from ${markers.length})`
          : ''}
        . Locations are approximate to within a few miles to keep members&rsquo; homes private.
        {located === false &&
          ' Allow location access to start near you.'}
      </p>
    </div>
  );
}
