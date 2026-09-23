-- ============================================================
-- The map was showing at most 500 of 3,979 members
-- ============================================================
-- Reported as "no dots over Georgia until you zoom in", and it was not the
-- clustering: the data never arrived.
--
-- users_in_bbox returns whole profiles and is hard-capped:
--
--     limit least(greatest(coalesce(max_rows, 500), 1), 1000)
--
-- with no ORDER BY. The map asks for 500. So a country-wide viewport matched
-- 3,979 members and returned an arbitrary 500 of them — arbitrary meaning
-- whatever order Postgres reads them off disk, which tracks insertion order
-- from the legacy migration. Whole states were systematically absent, and
-- zooming in shrank the box until the locals fitted under the cap and
-- "appeared".
--
-- Raising that cap is the obvious fix and the wrong one. Measured against
-- staging: a full profile is 481 bytes, so every member in a country-wide box
-- is 1.82 MB — refetched as the member pans. A map needs a dot, not a profile.
--
-- So: a second function that returns only what a dot needs. Same 3,979 rows
-- cost 253 KB, seven times smaller, and the cap can be high enough that the
-- question stops arising.
--
-- users_in_bbox is left exactly as it is. It is still the right call for the
-- card that opens when a pin is tapped, where whole profiles are the point.
-- ============================================================

create or replace function public.users_in_bbox_points(
  min_lat double precision, min_lng double precision,
  max_lat double precision, max_lng double precision,
  max_rows integer default 20000
)
returns table (
  id uuid,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select id, latitude, longitude
  from public.profiles
  where active
    and latitude between min_lat and max_lat
    and longitude between min_lng and max_lng
  -- Deliberately generous, and deliberately still bounded. 20k is roughly five
  -- times the current membership, so the map stops lying long before anyone
  -- notices it might; the ceiling only exists so a malformed box cannot ask
  -- for the whole table.
  limit least(greatest(coalesce(max_rows, 20000), 1), 50000);
$$;

-- Same posture as users_in_bbox: members only, never anonymous. Coordinates
-- are already snapped on the write path, so this exposes nothing finer than
-- the map has always shown.
grant execute on function public.users_in_bbox_points(
  double precision, double precision, double precision, double precision, integer
) to authenticated;

revoke execute on function public.users_in_bbox_points(
  double precision, double precision, double precision, double precision, integer
) from anon, public;

-- idx_profiles_geo on (latitude, longitude) where active already covers this
-- exactly, so no new index: it is the same predicate, fewer columns.
