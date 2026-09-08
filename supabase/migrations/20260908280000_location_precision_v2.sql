-- Coarsen member locations further: ~0.7 mile grid -> ~3.5 mile grid.
--
-- v1 stopped the real problem, which was storing the raw GPS fix. But two
-- decimal places is a 0.7 mile grid, so a pin still landed within about a
-- quarter mile of someone's front door on average. Zoomed in, that reads as
-- the right neighbourhood and sometimes the right block, which is not what
-- "we never show a member's location" is supposed to mean.
--
-- 0.05 degrees is a grid of roughly 3.5 miles, so a pin is up to about 1.7
-- miles from the truth. That still answers the question the map exists to
-- answer, "are there members near me", while pointing at a district rather
-- than a street. In a support community you message the people you find; you
-- do not drive to them.
--
-- Same reasoning as v1 on the method: a stable snap rather than a random
-- offset. Noise that is recomputed per read can be averaged away by sampling
-- the same member repeatedly, and snapping puts everyone in a cell on the
-- identical point, so neighbours are indistinguishable rather than merely
-- moved.

-- Grid size in degrees. One place to change it, used by both the trigger and
-- the backfill below.
create or replace function public.location_grid_degrees()
returns numeric language sql immutable set search_path = pg_temp as $$
  select 0.05::numeric;
$$;

comment on function public.location_grid_degrees() is
  'Cell size for member map locations, in degrees. 0.05 is roughly 3.5 miles.';

create or replace function public.round_profile_location()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  g numeric := public.location_grid_degrees();
begin
  if new.latitude is not null then
    new.latitude := (round(new.latitude::numeric / g) * g)::double precision;
  end if;
  if new.longitude is not null then
    new.longitude := (round(new.longitude::numeric / g) * g)::double precision;
  end if;
  return new;
end;
$$;

-- The trigger itself is unchanged from v1 and already fires on insert and on
-- update of these columns; recreated here so this file stands alone.
drop trigger if exists trg_profiles_round_location on public.profiles;
create trigger trg_profiles_round_location
  before insert or update of latitude, longitude on public.profiles
  for each row execute function public.round_profile_location();

comment on function public.round_profile_location() is
  'Snaps every location written to profiles onto a ~3.5 mile grid. Exact coordinates are never stored, on any write path.';

-- Re-coarsen everything already on record, including the rows v1 rounded to
-- two decimals. Skips rows already on the grid, so it is a no-op on re-run.
update public.profiles
   set latitude  = (round(latitude::numeric  / public.location_grid_degrees())
                    * public.location_grid_degrees())::double precision,
       longitude = (round(longitude::numeric / public.location_grid_degrees())
                    * public.location_grid_degrees())::double precision
 where (latitude is not null
        and latitude <> (round(latitude::numeric / public.location_grid_degrees())
                         * public.location_grid_degrees())::double precision)
    or (longitude is not null
        and longitude <> (round(longitude::numeric / public.location_grid_degrees())
                          * public.location_grid_degrees())::double precision);

-- ============================================================
-- Stop the map re-rounding to a finer grid
-- ============================================================
-- users_in_bbox rounds to two decimals on read. That was the original privacy
-- measure and it is now the coarser of the two in name only: rounding an
-- already-snapped coordinate to 2dp does nothing, but leaving it there invites
-- someone to assume the map is what protects members. The protection is the
-- write path. Rewritten to return the stored value as-is, so there is exactly
-- one place where precision is decided.
-- Signature and return columns are unchanged from
-- 20260706015837_spatial_index_and_avatar_listing.sql; only the rounding in
-- the body differs, so this is a plain replace.
create or replace function public.users_in_bbox(
  min_lat double precision, min_lng double precision,
  max_lat double precision, max_lng double precision,
  max_rows integer default 500
)
returns table (
  id uuid, first_name text, last_name text, display_name text, avatar_path text,
  role_id uuid, diagnosis_type_ids uuid[], diagnosis_subtype_ids uuid[],
  diagnosis_year text, age_range text, gender text, city text, state text,
  country text, latitude double precision, longitude double precision,
  active boolean, created_at timestamptz
)
language sql stable security invoker set search_path = public as $$
  select id, first_name, null::text as last_name, display_name, avatar_path,
         role_id, diagnosis_type_ids, diagnosis_subtype_ids, diagnosis_year,
         age_range, gender, city, state, country,
         -- Already snapped to the grid on write. No further rounding here:
         -- one place decides precision, and it is the write path.
         latitude,
         longitude,
         active, created_at
  from public.profiles
  where active
    and latitude between min_lat and max_lat
    and longitude between min_lng and max_lng
  limit least(greatest(coalesce(max_rows, 500), 1), 1000);
$$;

grant execute on function public.users_in_bbox(double precision, double precision, double precision, double precision, integer) to authenticated;
revoke execute on function public.users_in_bbox(double precision, double precision, double precision, double precision, integer) from anon, public;
