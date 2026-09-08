import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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

// Centres the map on the member's own location once, if they allow it.
// Someone opening a "who is near me" map wants to be near themselves; the
// whole-US view answers a question nobody asked.
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

type Filters = {
  roles: string[];
  diagnoses: string[];
  gender: string;
  ageRange: string;
};

const EMPTY_FILTERS: Filters = { roles: [], diagnoses: [], gender: '', ageRange: '' };

export function MapPage() {
  const { isEnabled } = useFeatureFlags();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
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
        if (filters.roles.length && (!m.role_id || !filters.roles.includes(m.role_id)))
          return false;
        if (filters.diagnoses.length) {
          const mine = m.diagnosis_type_ids ?? [];
          if (!filters.diagnoses.some((d) => mine.includes(d))) return false;
        }
        if (filters.gender && m.gender !== filters.gender) return false;
        if (filters.ageRange && m.age_range !== filters.ageRange) return false;
        return true;
      }),
    [markers, filters],
  );

  const activeCount =
    filters.roles.length +
    filters.diagnoses.length +
    (filters.gender ? 1 : 0) +
    (filters.ageRange ? 1 : 0);

  const toggle = (key: 'roles' | 'diagnoses', id: string) =>
    setFilters((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));

  if (!isEnabled('community_map'))
    return <p className="text-muted">The community map is turned off.</p>;

  const chip = (on: boolean) =>
    'rounded-full border px-3 py-1 text-sm transition-colors ' +
    (on
      ? 'border-magenta bg-magenta text-white'
      : 'border-line text-body hover:border-magenta hover:text-magenta-text');

  const selectClass =
    'rounded-lg border border-line-strong px-3 py-1.5 text-sm outline-none focus:border-magenta';

  return (
    <div>
      <PageTitle
        actions={
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={
              'rounded-lg border px-3 py-2 text-sm transition-colors ' +
              (activeCount
                ? 'border-magenta text-magenta-text'
                : 'border-line text-body hover:border-magenta')
            }
          >
            Filters{activeCount > 0 && ` (${activeCount})`}
          </button>
        }
      >
        Community map
      </PageTitle>

      {showFilters && (
        <div className="mb-3 space-y-4 rounded-2xl border border-line bg-surface p-4">
          <div>
            <div className="mb-2 text-sm font-semibold text-heading">I am looking for</div>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggle('roles', r.id)}
                  className={chip(filters.roles.includes(r.id))}
                >
                  {r.description}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-heading">Diagnosis</div>
            <div className="flex flex-wrap gap-2">
              {diagnosisOptions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggle('diagnoses', d.id)}
                  className={chip(filters.diagnoses.includes(d.id))}
                >
                  {d.description}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            {genderOptions.length > 0 && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-heading">Gender</span>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Any</option>
                  {genderOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {ageOptions.length > 0 && (
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-heading">Age</span>
                <select
                  value={filters.ageRange}
                  onChange={(e) => setFilters((f) => ({ ...f, ageRange: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Any</option>
                  {ageOptions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {activeCount > 0 && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="pb-1.5 text-sm text-magenta-text hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="overflow-hidden rounded-2xl border border-line"
        style={{ height: '70vh' }}
      >
        <MapContainer
          center={US_CENTER}
          zoom={US_ZOOM}
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
          <LocateOnFirstLoad onResolved={setLocated} />
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
                    className="font-semibold text-heading hover:underline"
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
        . Locations are approximate to about a kilometre, on purpose.
        {located === false &&
          ' Allow location access to start near you.'}
      </p>
    </div>
  );
}
