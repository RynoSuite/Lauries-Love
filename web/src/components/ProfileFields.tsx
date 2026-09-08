import { useState } from 'react';
import { useDefinitions } from '../lib/useDefinitions';

// The profile fields shared by onboarding and profile editing.
//
// These started life only in onboarding, which meant a member could answer
// them once at signup and then never change them: the edit form offered
// display name, bio, email and phone and nothing else. Rather than write the
// same 150 lines twice and let the two drift, both surfaces render this.
//
// Name lives here too. It was missing from the edit form altogether, so a
// member who typed their name wrong at signup, or changed it, had no way to
// fix it.

export const AGE_RANGES = ['18-29', '30-39', '40-49', '50-59', '60-69', '70+'];
export const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

const THIS_YEAR = new Date().getFullYear();
// Far enough back to cover long survivorship without an endless list.
export const YEARS = Array.from({ length: 61 }, (_, i) => String(THIS_YEAR - i));

export type ProfileForm = {
  first_name: string;
  last_name: string;
  display_name: string;
  description: string;
  role_id: string;
  diagnosis_type_ids: string[];
  diagnosis_subtype_ids: string[];
  diagnosis_year: string;
  age_range: string;
  gender: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
};

export const EMPTY_PROFILE_FORM: ProfileForm = {
  first_name: '',
  last_name: '',
  display_name: '',
  description: '',
  role_id: '',
  diagnosis_type_ids: [],
  diagnosis_subtype_ids: [],
  diagnosis_year: '',
  age_range: '',
  gender: '',
  city: '',
  state: '',
  zip_code: '',
  latitude: null,
  longitude: null,
};

// The public columns these fields map to, so both pages select the same set.
export const PROFILE_COLUMNS =
  'first_name, last_name, display_name, description, role_id, diagnosis_type_ids, diagnosis_subtype_ids, diagnosis_year, age_range, gender, city, state, latitude, longitude';

// Builds the profiles update payload. Empty strings become null rather than
// writing '' into a column that other code null-checks.
export function profileUpdatePayload(f: ProfileForm) {
  return {
    first_name: f.first_name.trim() || null,
    last_name: f.last_name.trim() || null,
    display_name: f.display_name.trim() || null,
    description: f.description.trim() || null,
    role_id: f.role_id || null,
    diagnosis_type_ids: f.diagnosis_type_ids,
    diagnosis_subtype_ids: f.diagnosis_subtype_ids,
    diagnosis_year: f.diagnosis_year || null,
    age_range: f.age_range || null,
    gender: f.gender || null,
    city: f.city.trim() || null,
    state: f.state.trim() || null,
    latitude: f.latitude,
    longitude: f.longitude,
  };
}

// Snap onto the same ~3.5 mile grid the database trigger uses, so a member's
// pin is identical wherever it is read from. Kept in step with
// location_grid_degrees() in 20260908280000_location_precision_v2.sql.
const LOCATION_GRID_DEGREES = 0.05;

function coarsen(n: number) {
  return Math.round(n / LOCATION_GRID_DEGREES) * LOCATION_GRID_DEGREES;
}

const inputClass =
  'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta';

const chip = (on: boolean) =>
  'rounded-full border px-3 py-1.5 text-sm transition-colors ' +
  (on
    ? 'border-magenta bg-magenta text-white'
    : 'border-line text-body hover:border-magenta hover:text-magenta-text');

export function ProfileFields({
  form,
  setForm,
  onLocationError,
}: {
  form: ProfileForm;
  setForm: React.Dispatch<React.SetStateAction<ProfileForm>>;
  onLocationError?: (message: string) => void;
}) {
  const { roles, diagnoses, subtypes } = useDefinitions();
  const [locating, setLocating] = useState(false);

  function toggleId(key: 'diagnosis_type_ids' | 'diagnosis_subtype_ids', id: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      onLocationError?.('This browser cannot share a location.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Coarsened here as well as by the database trigger. The precise fix
        // should not travel over the network or sit in a request log on its
        // way to being rounded at the far end.
        setForm((f) => ({
          ...f,
          latitude: coarsen(pos.coords.latitude),
          longitude: coarsen(pos.coords.longitude),
        }));
        setLocating(false);
      },
      () => {
        onLocationError?.('Could not get your location. You can still fill in your city.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-sans text-sm font-semibold text-magenta-text">
          Your name
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-heading">First name</span>
            <input
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-heading">Last name</span>
            <input
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              className={inputClass}
            />
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-heading">
            Display name
          </span>
          <span className="mb-1 block text-xs text-faint">
            What other members see. Leave it blank to go by your first name.
          </span>
          <input
            value={form.display_name}
            onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-heading">About you</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={inputClass + ' resize-none'}
          />
        </label>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-sans text-sm font-semibold text-magenta-text">
          Which describes you?
        </h2>
        <p className="mb-3 text-xs text-faint">
          Members search by this when looking for someone who understands.
        </p>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, role_id: f.role_id === r.id ? '' : r.id }))
              }
              className={chip(form.role_id === r.id)}
            >
              {r.description}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-sans text-sm font-semibold text-magenta-text">
          Diagnosis
        </h2>
        <p className="mb-3 text-xs text-faint">
          Choose any that apply, to you or to the person you care for.
        </p>
        <div className="flex flex-wrap gap-2">
          {diagnoses.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleId('diagnosis_type_ids', d.id)}
              className={chip(form.diagnosis_type_ids.includes(d.id))}
            >
              {d.description}
            </button>
          ))}
        </div>

        {form.diagnosis_type_ids.length > 0 && subtypes.length > 0 && (
          <>
            <h3 className="mb-2 mt-4 text-sm font-medium text-heading">
              Stage or detail
            </h3>
            <div className="flex flex-wrap gap-2">
              {subtypes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleId('diagnosis_subtype_ids', s.id)}
                  className={chip(form.diagnosis_subtype_ids.includes(s.id))}
                >
                  {s.description}
                </button>
              ))}
            </div>
          </>
        )}

        <label className="mt-4 block max-w-[200px]">
          <span className="mb-1 block text-sm font-medium text-heading">
            Year of diagnosis
          </span>
          <select
            value={form.diagnosis_year}
            onChange={(e) => setForm((f) => ({ ...f, diagnosis_year: e.target.value }))}
            className={inputClass}
          >
            <option value="">Prefer not to say</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-sans text-sm font-semibold text-magenta-text">
          About you
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-heading">Age</span>
            <select
              value={form.age_range}
              onChange={(e) => setForm((f) => ({ ...f, age_range: e.target.value }))}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              {AGE_RANGES.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-heading">Gender</span>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-1 font-sans text-sm font-semibold text-magenta-text">
          Where you are
        </h2>
        <p className="mb-3 text-xs leading-relaxed text-faint">
          This puts you on the member map so people in your area can find you.
          Your exact position is never stored: it is snapped to a grid of a few
          miles before it is saved, so neither we nor other members can see
          where you actually live. Your zip code is never shown to other
          members.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-heading">City</span>
            <input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-heading">State</span>
            <input
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-heading">Zip code</span>
            <input
              value={form.zip_code}
              onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="rounded-lg border border-line px-3 py-2 text-sm text-body transition-colors hover:border-magenta hover:text-magenta-text disabled:opacity-50"
          >
            {locating ? 'Finding you…' : 'Use my current location'}
          </button>
          {form.latitude != null && (
            <span className="text-sm text-success">
              Location set. You will appear on the map.
            </span>
          )}
          {form.latitude != null && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, latitude: null, longitude: null }))}
              className="text-sm text-muted hover:text-danger"
            >
              Remove from map
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
