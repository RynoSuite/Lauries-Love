import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFeatureFlags } from '../lib/featureFlags';
import { PageTitle } from '../components/PageTitle';

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

function ViewportLoader({ onData }: { onData: (m: Marker[]) => void }) {
  const load = useCallback(
    async (b: L.LatLngBounds) => {
      const { data } = await supabase.rpc('users_in_bbox', {
        min_lat: b.getSouth(),
        min_lng: b.getWest(),
        max_lat: b.getNorth(),
        max_lng: b.getEast(),
        max_rows: 500,
      });
      onData(
        ((data ?? []) as Marker[]).filter(
          (u) => u.latitude != null && u.longitude != null,
        ),
      );
    },
    [onData],
  );

  const map = useMapEvents({
    moveend: () => load(map.getBounds()),
  });
  useState(() => {
    load(map.getBounds());
    return null;
  });
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
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [located, setLocated] = useState<boolean | null>(null);

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

  const visible = useMemo(
    () =>
      markers.filter((m) => {
        if (filters.role && m.role_id !== filters.role) return false;
        if (filters.diagnosis && !(m.diagnosis_type_ids ?? []).includes(filters.diagnosis))
          return false;
        if (filters.gender && m.gender !== filters.gender) return false;
        if (filters.ageRange && m.age_range !== filters.ageRange) return false;
        return true;
      }),
    [markers, filters],
  );

  // ?lat/?lng come from a member profile's "View on map".
  const [searchParams] = useSearchParams();
  const focus = useMemo(() => {
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    return Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)
      ? { lat, lng }
      : null;
  }, [searchParams]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  if (!isEnabled('community_map'))
    return <p className="text-muted">The community map is turned off.</p>;


  return (
    <div>
      <PageTitle>Community map</PageTitle>

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
          Showing <span className="font-semibold text-heading">{visible.length}</span> of{' '}
          <span className="font-semibold text-heading">{markers.length}</span> member
          {markers.length === 1 ? '' : 's'} in view
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
          <ViewportLoader onData={setMarkers} />
          <MarkerClusterGroup chunkedLoading showCoverageOnHover={false}>
            {visible.map((m) => (
              <CircleMarker
                key={m.id}
                center={[m.latitude, m.longitude]}
                radius={8}
                pathOptions={{
                  color: '#F45FAF',
                  weight: 2,
                  fillColor: '#911766',
                  fillOpacity: 0.85,
                }}
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
