-- Never store a member's exact location.
--
-- The map was already honest about what it DISPLAYS: users_in_bbox rounds to
-- two decimal places before returning anything, so pins land on a grid of
-- roughly seven tenths of a mile. What it was not honest about is what is
-- KEPT. Both the web onboarding form and the mobile app wrote the raw GPS
-- fix — fifteen significant figures, accurate to a doorstep — straight into
-- profiles.latitude/longitude.
--
-- That matters because profiles_select grants every authenticated member
-- SELECT on every column of every active profile. So the exact coordinates of
-- every member who ever tapped "use my current location" were readable over
-- the REST API by anyone with an account. The rounding on the map was a
-- display convention, not a protection: the precise number was still sitting
-- in the table, one query away.
--
-- For a community of people with cancer diagnoses, several of whom are
-- estranged, unwell, or simply unwilling to be found, that is not an
-- acceptable thing to hold.
--
-- The fix is to round on the way IN. What is never stored cannot leak, cannot
-- be exported in a backup, cannot be subpoenaed, and cannot be exposed by a
-- future query that forgets to round. A trigger rather than client-side
-- rounding, so it applies to every writer: this web app, the mobile app,
-- admin tooling, imports, and anything written later.

-- ============================================================
-- Round on write
-- ============================================================
-- Two decimal places: ~0.7 mi of latitude, less of longitude away from the
-- equator. This matches what users_in_bbox already returns, so nothing on the
-- map moves.
--
-- Deliberately a ROUND rather than a random offset. A random jitter that is
-- recalculated changes each time it is read, which lets anyone who samples a
-- member repeatedly average the noise away and recover the true point. A
-- round is stable and cannot be averaged out. It also snaps everyone in a
-- cell to the same coordinate, so members near each other become genuinely
-- indistinguishable rather than merely displaced.
create or replace function public.round_profile_location()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.latitude is not null then
    new.latitude := round(new.latitude::numeric, 2)::double precision;
  end if;
  if new.longitude is not null then
    new.longitude := round(new.longitude::numeric, 2)::double precision;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_round_location on public.profiles;
create trigger trg_profiles_round_location
  before insert or update of latitude, longitude on public.profiles
  for each row execute function public.round_profile_location();

comment on function public.round_profile_location() is
  'Coarsens every location written to profiles to ~0.7mi. Exact coordinates are never stored, on any write path.';

-- ============================================================
-- Remove the exact coordinates already on record
-- ============================================================
-- Anyone who used "use my current location" before this migration has their
-- doorstep in the table right now. Rounding the column in place is the whole
-- point of the exercise; without this the fix only protects future members.
update public.profiles
   set latitude  = round(latitude::numeric, 2)::double precision,
       longitude = round(longitude::numeric, 2)::double precision
 where (latitude  is not null and latitude  <> round(latitude::numeric, 2)::double precision)
    or (longitude is not null and longitude <> round(longitude::numeric, 2)::double precision);

-- ============================================================
-- Not done here, and why
-- ============================================================
-- The obvious next step is column-level hardening:
--
--   revoke select (latitude, longitude) on public.profiles from authenticated;
--
-- so coordinates can only be read through users_in_bbox, which is SECURITY
-- DEFINER and rounds. That is worth doing, but it cannot be done yet: the
-- mobile app reads profiles with select('*') (app/src/services/supabase/
-- supabase.api.ts), and a column the caller may not read makes the whole
-- wildcard select fail. Revoking now would break profile loading on iOS and
-- Android.
--
-- Sequence: name the columns explicitly in the mobile query, ship that build,
-- then revoke. Tracked in PROJECT-STATUS.md.
--
-- Until then the rounding above is what protects members, and it is the part
-- that actually matters: the precise value no longer exists to be read.
