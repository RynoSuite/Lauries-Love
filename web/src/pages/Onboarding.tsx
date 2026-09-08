import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { PageTitle } from '../components/PageTitle';
import {
  ProfileFields,
  EMPTY_PROFILE_FORM,
  PROFILE_COLUMNS,
  profileUpdatePayload,
  type ProfileForm,
} from '../components/ProfileFields';

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
//
// The fields themselves live in ProfileFields, shared with the profile editor
// so that the two can never drift apart.
export function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE_FORM);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Prefill from whatever is already on the profile, so someone returning to
  // finish is not made to retype what they gave.
  useEffect(() => {
    (async () => {
      const me = await currentUserId();
      if (!me) return;
      const [{ data: pub }, { data: priv }] = await Promise.all([
        supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', me).maybeSingle(),
        supabase
          .from('profiles_private')
          .select('zip_code')
          .eq('profile_id', me)
          .maybeSingle(),
      ]);
      if (!pub) return;
      const p = pub as Partial<ProfileForm>;
      setForm((f) => ({
        ...f,
        first_name: p.first_name ?? '',
        last_name: p.last_name ?? '',
        display_name: p.display_name ?? '',
        description: p.description ?? '',
        role_id: p.role_id ?? '',
        diagnosis_type_ids: p.diagnosis_type_ids ?? [],
        diagnosis_subtype_ids: p.diagnosis_subtype_ids ?? [],
        diagnosis_year: p.diagnosis_year ?? '',
        age_range: p.age_range ?? '',
        gender: p.gender ?? '',
        city: p.city ?? '',
        state: p.state ?? '',
        country: p.country || 'United States',
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        zip_code: (priv as { zip_code?: string } | null)?.zip_code ?? '',
      }));
    })();
  }, []);

  async function save(skip = false) {
    setBusy(true);
    setErr(null);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');

      if (!skip) {
        const { error } = await supabase
          .from('profiles')
          .update(profileUpdatePayload(form))
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

  return (
    <div className="mx-auto max-w-2xl pb-12">
      <PageTitle>Tell us about you</PageTitle>
      <p className="mb-6 text-sm leading-relaxed text-muted">
        This is how we connect you with people on a similar road. Everything
        here is optional, and you can change any of it later from your profile.
      </p>

      <ProfileFields form={form} setForm={setForm} onLocationError={setErr} />

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
