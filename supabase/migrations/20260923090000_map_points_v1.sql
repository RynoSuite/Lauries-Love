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
-- 3,979 members and returned an arbitrary 500 - arbitrary meaning whatever
-- order Postgres reads them off disk, which tracks insertion order from the
-- legacy migration. Whole states were systematically absent, and zooming in
-- shrank the box until the locals fitted under the cap and "appeared".
--
-- Worse than sparse dots: the screen then filtered those rows in memory by
-- role, age, gender, diagnosis and country. So every filtered view was
-- filtering an arbitrary eighth of the membership.
--
-- Raising the cap is the obvious fix and the wrong one. Measured on staging:
--
--     whole profile      478 B/row  ->  1.81 MB for 3,979
--     lean but filterable 352 B/row  ->  1.37 MB
--     id + lat + lng       81 B/row  ->   315 KB
--
-- and that is refetched as the member pans. A map needs a dot, not a profile.
--
-- So this returns dots, and does the filtering here - which is where it
-- belonged, because filtering can only be correct if it happens before the
-- limit. users_in_bbox is left exactly as it is; it is still right for the
-- card that opens when a pin is tapped.
--
-- The filters take DESCRIPTIONS, not ids, because that is what the screen
-- already holds: FiltersModal builds its options as { id: description }. This
-- resolves them against value_definitions so the client keeps sending exactly
-- what it sends today.
-- ============================================================

create or replace function public.users_in_bbox_points(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  -- Every filter is NULL-or-empty means "no filter", matching the screen,
  -- where an empty selection means everyone.
  p_roles            text[] default null,  -- value_definitions.description
  p_ages             text[] default null,  -- profiles.age_range
  p_genders          text[] default null,  -- profiles.gender
  p_diagnosis_types  text[] default null,  -- value_definitions.description
  p_diagnosis_years  text[] default null,  -- profiles.diagnosis_year
  p_countries        text[] default null,  -- code OR name, either accepted
  p_city             text   default null,  -- substring, case-insensitive
  max_rows integer default 20000
)
returns table (
  id uuid,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select p.id, p.latitude, p.longitude
  from public.profiles p
  where p.active
    and p.latitude  between min_lat and max_lat
    and p.longitude between min_lng and max_lng

    and (p_roles is null or cardinality(p_roles) = 0 or p.role_id in (
      select v.id from public.value_definitions v
      where v.definition_type = 'USER_ROLE' and v.description = any(p_roles)
    ))

    and (p_ages is null or cardinality(p_ages) = 0
         or p.age_range = any(p_ages))

    and (p_genders is null or cardinality(p_genders) = 0
         or p.gender = any(p_genders))

    -- A member can hold several diagnoses and the filter is "any of these",
    -- so this is array overlap, matching the screen's .some(...).
    and (p_diagnosis_types is null or cardinality(p_diagnosis_types) = 0
         or p.diagnosis_type_ids && array(
              select v.id from public.value_definitions v
              where v.definition_type = 'DIAGNOSIS_TYPE'
                and v.description = any(p_diagnosis_types)
            ))

    and (p_diagnosis_years is null or cardinality(p_diagnosis_years) = 0
         or p.diagnosis_year = any(p_diagnosis_years))

    -- The filter carries country CODES ("US") while a profile stores the NAME
    -- ("United States"). The screen accepts either, case-insensitively, and so
    -- does this - the client sends both the code and the label.
    and (p_countries is null or cardinality(p_countries) = 0
         or lower(p.country) = any(select lower(c) from unnest(p_countries) c))

    and (p_city is null or p_city = ''
         or p.city ilike '%' || p_city || '%')

  -- Generous, and still bounded. 20k is about five times the current
  -- membership, so the map stops lying long before anyone notices it might;
  -- the ceiling exists only so a malformed box cannot ask for the whole table.
  limit least(greatest(coalesce(max_rows, 20000), 1), 50000);
$$;

-- Same posture as users_in_bbox: members only, never anonymous. Coordinates
-- are already snapped on the write path, so this exposes nothing finer than
-- the map has always shown - and it returns strictly less than users_in_bbox.
grant execute on function public.users_in_bbox_points(
  double precision, double precision, double precision, double precision,
  text[], text[], text[], text[], text[], text[], text, integer
) to authenticated;

revoke execute on function public.users_in_bbox_points(
  double precision, double precision, double precision, double precision,
  text[], text[], text[], text[], text[], text[], text, integer
) from anon, public;

-- idx_profiles_geo on (latitude, longitude) where active already covers the
-- bbox predicate exactly: same columns, same partial condition, fewer columns
-- selected. The filters run against the rows that survive it.


-- ============================================================
-- One marker per state when zoomed out
-- ============================================================
-- What the board asked for, and what the map could not do: zoomed out it drew
-- a handful of grid-cell centroids, which is why "185" sat over Mexico and
-- "313" over the Gulf of Mexico — a cell spanning half a continent averages to
-- the middle of nowhere. Clustering by geometry cannot answer "how many
-- members are in Georgia".
--
-- Aggregating by state answers it exactly, and cheaply: ~50 rows instead of
-- 3,979, so the zoomed-out view stops moving thousands of coordinates it only
-- ever collapses into bubbles. The position is the average of that state's own
-- members, so a marker always lands among the people it counts.
--
-- Same filters as users_in_bbox_points, for the same reason: a count is only
-- honest if it is counted after filtering and before any limit.
create or replace function public.members_by_state(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  p_roles            text[] default null,
  p_ages             text[] default null,
  p_genders          text[] default null,
  p_diagnosis_types  text[] default null,
  p_diagnosis_years  text[] default null,
  p_countries        text[] default null,
  p_city             text   default null
)
returns table (
  label text,
  member_count bigint,
  latitude double precision,
  longitude double precision
)
language sql stable security invoker set search_path = public as $$
  select
    -- Members outside the US have no state, so they group by country rather
    -- than collapsing into one meaningless "no state" pile.
    coalesce(nullif(trim(p.state), ''), nullif(trim(p.country), ''), 'Unknown') as label,
    count(*) as member_count,
    avg(p.latitude)  as latitude,
    avg(p.longitude) as longitude
  from public.profiles p
  where p.active
    and p.latitude  between min_lat and max_lat
    and p.longitude between min_lng and max_lng

    and (p_roles is null or cardinality(p_roles) = 0 or p.role_id in (
      select v.id from public.value_definitions v
      where v.definition_type = 'USER_ROLE' and v.description = any(p_roles)
    ))
    and (p_ages is null or cardinality(p_ages) = 0
         or p.age_range = any(p_ages))
    and (p_genders is null or cardinality(p_genders) = 0
         or p.gender = any(p_genders))
    and (p_diagnosis_types is null or cardinality(p_diagnosis_types) = 0
         or p.diagnosis_type_ids && array(
              select v.id from public.value_definitions v
              where v.definition_type = 'DIAGNOSIS_TYPE'
                and v.description = any(p_diagnosis_types)
            ))
    and (p_diagnosis_years is null or cardinality(p_diagnosis_years) = 0
         or p.diagnosis_year = any(p_diagnosis_years))
    and (p_countries is null or cardinality(p_countries) = 0
         or lower(p.country) = any(select lower(c) from unnest(p_countries) c))
    and (p_city is null or p_city = ''
         or p.city ilike '%' || p_city || '%')

  group by 1
  -- No limit: this is one row per state, and there are fifty of them.
  order by 2 desc;
$$;

grant execute on function public.members_by_state(
  double precision, double precision, double precision, double precision,
  text[], text[], text[], text[], text[], text[], text
) to authenticated;

revoke execute on function public.members_by_state(
  double precision, double precision, double precision, double precision,
  text[], text[], text[], text[], text[], text[], text
) from anon, public;
