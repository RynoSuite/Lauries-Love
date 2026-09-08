import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useDefinitions } from '../lib/useDefinitions';
import { PageTitle } from '../components/PageTitle';

// Finish setting up a profile.
//
// Web signup collected a name, an email and a password. The mobile app asks
// for ten screens' worth: role, cancer type, sub-type, year of diagnosis, age,
// gender and location. Everything after the password was simply missing on
// web, which is why members who joined here had no role on their profile, did
// not appear usefully on the map, and could not be matched to groups.
//
// Presented as one page rather than mobile's ten steps. A wizard is right on a
// phone, where one question fills the screen; on a desktop it turns a
// two-minute form into ten page loads.
//
// Every field is optional and the page can be skipped. Mobile gates access on
// completeness, and that gate is exactly what locked members out in August —
// a profile missing one field bounced people back to onboarding forever. A
// nudge is worth more than a wall.

const AGE_RANGES = ['18-29', '30-39', '40-49', '50-59', '60-69', '70+'];
const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

const THIS_YEAR = new Date().getFullYear();
// Far enough back to cover long survivorship without an endless list.
const YEARS = Array.from({ length: 61 }, (_, i) => String(THIS_YEAR - i));

type Form = {
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

const EMPTY: Form = {
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

export function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { roles, diagnoses, subtypes } = useDefinitions();
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Prefill from whatever is already on the profile, so someone returning to
  // finish is not made to retype what they gave.
  useEffect(() => {
    (async () => {
      const me = await currentUserId();
      if (!me) return;
      const [{ data: pub }, { data: priv }] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'role_id, diagnosis_type_ids, diagnosis_subtype_ids, diagnosis_year, age_range, gender, city, state, latitude, longitude',
          )
          .eq('id', me)
          .maybeSingle(),
        supabase.from('profiles_private').select('zip_code').eq('profile_id', me).maybeSingle(),
      ]);
      if (!pub) return;
      const p = pub as Partial<Form>;
      setForm((f) => ({
        ...f,
        role_id: p.role_id ?? '',
        diagnosis_type_ids: p.diagnosis_type_ids ?? [],
        diagnosis_subtype_ids: p.diagnosis_subtype_ids ?? [],
        diagnosis_year: p.diagnosis_year ?? '',
        age_range: p.age_range ?? '',
        gender: p.gender ?? '',
        city: p.city ?? '',
        state: p.state ?? '',
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        zip_code: (priv as { zip_code?: string } | null)?.zip_code ?? '',
      }));
    })();
  }, []);

  function toggleId(key: 'diagnosis_type_ids' | 'diagnosis_subtype_ids', id: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id],
    }));
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErr('This browser cannot share a location.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setLocating(false);
      },
      () => {
        setErr('Could not get your location. You can still fill in your city.');
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function save(skip = false) {
    setBusy(true);
    setErr(null);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');

      if (!skip) {
        const { error } = await supabase
          .from('profiles')
          .update({
            role_id: form.role_id || null,
            diagnosis_type_ids: form.diagnosis_type_ids,
            diagnosis_subtype_ids: form.diagnosis_subtype_ids,
            diagnosis_year: form.diagnosis_year || null,
            age_range: form.age_range || null,
            gender: form.gender || null,
            city: form.city.trim() || null,
            state: form.state.trim() || null,
            latitude: form.latitude,
            longitude: form.longitude,
          })
          .eq('id', me);
        if (error) throw error;

        // Zip is PII and lives in the owner-only table, not on the public
        // profile, so it is written separately.
        if (form.zip_code.trim()) {
          const { error: pErr } = await supabase
            .from('profiles_private')
            .upsert(
              { profile_id: me, zip_code: form.zip_code.trim() },
              { onConflict: 'profile_id' },
            );
          if (pErr) throw pErr;
        }
      }

      // Remembered per browser so the prompt does not reappear every login for
      // someone who chose to skip.
      try {
        localStorage.setItem('ll.onboardingSeen', '1');
      } catch {
        /* private window: being asked again is a mild annoyance, not a bug */
      }

      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['my-avatar'] });
      navigate('/', { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta';
  const chip = (on: boolean) =>
    'rounded-full border px-3 py-1.5 text-sm transition-colors ' +
    (on
      ? 'border-magenta bg-magenta text-white'
      : 'border-line text-body hover:border-magenta hover:text-magenta-text');

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <PageTitle>Tell us about you</PageTitle>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        This is how we connect you with people on a similar road. Everything
        here is optional, and you can change any of it later from your profile.
      </p>

      <div className="space-y-6">
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
            This puts you on the member map so people nearby can find you. Your
            pin is deliberately approximate, to about half a mile, and your zip
            code is never shown to other members.
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
          </div>
        </section>
      </div>

      {err && <p className="mt-4 text-sm text-danger">{err}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={() => save(false)}
          disabled={busy}
          className="rounded-lg bg-magenta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save and continue'}
        </button>
        <button
          onClick={() => save(true)}
          disabled={busy}
          className="text-sm text-muted hover:text-heading hover:underline"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
