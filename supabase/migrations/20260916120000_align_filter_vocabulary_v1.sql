-- One vocabulary for age_range and gender, across web and mobile.
--
-- The two apps wrote different strings into the same two columns, and every
-- filter in both compares with strict equality. A member who answered on web
-- was invisible to mobile's filters and vice versa — silently, with no error
-- and no empty state, just absence. This is the data half of that fix; the
-- code half is in web/src/components/ProfileFields.tsx,
-- app/src/constants/onboarding.ts, app/src/constants/map.ts and
-- app/src/main/screens/ProfileTab/ProfileTab.constants.ts.
--
-- The canon is mobile's, because the 2,221 legacy members already carry it and
-- web's buckets cannot represent it. `45-59` — 930 real people — has no
-- equivalent in 18-29/30-39/40-49/50-59/60-69/70+.
--
--   age_range   18-34 | 35-44 | 45-59 | 60-plus
--   gender      female | male | non-binary | prefer-not-to-say
--
-- Run BEFORE the legacy import. Afterwards it would be a mass update across
-- 2,221 real profiles instead of a handful of demo and test rows.

begin;

-- ── age_range ───────────────────────────────────────────────────────────────
--
-- Four of web's six buckets sit wholly inside one canonical bucket and convert
-- exactly. Two do not: 30-39 straddles 18-34 and 35-44, and 40-49 straddles
-- 35-44 and 45-59, each splitting five years to each side. There is no correct
-- answer for those, so they are left ALONE rather than guessed at — a wrong
-- age is worse than a blank one, and the profile banner will ask the member.
update public.profiles set age_range = case age_range
  when '18-29' then '18-34'    -- contained
  when '50-59' then '45-59'    -- contained
  when '60-69' then '60-plus'  -- contained
  when '70+'   then '60-plus'  -- contained
  else age_range
end
where age_range in ('18-29', '50-59', '60-69', '70+');

-- Values from the mobile profile editor's own bugs: it wrote '55-59' under a
-- label reading '45-59', and '60+' where onboarding writes '60-plus'.
update public.profiles set age_range = '45-59'   where age_range = '55-59';
update public.profiles set age_range = '60-plus' where age_range = '60+';

-- ── gender ──────────────────────────────────────────────────────────────────
--
-- Web stored display labels, which is why these are capitalised. 'any' came
-- from the mobile profile editor, where "Prefer Not To Say" wrote a value no
-- filter listed.
update public.profiles set gender = case lower(trim(gender))
  when 'female'             then 'female'
  when 'male'               then 'male'
  when 'non-binary'         then 'non-binary'
  when 'nonbinary'          then 'non-binary'
  when 'prefer not to say'  then 'prefer-not-to-say'
  when 'prefer-not-to-say'  then 'prefer-not-to-say'
  when 'any'                then 'prefer-not-to-say'
  else gender
end
where gender is not null and gender <> '';

-- ── What is left ────────────────────────────────────────────────────────────
--
-- Deliberately NOT a CHECK constraint. The legacy import is still to come and
-- carries values we have not met yet; a constraint here would abort a 2,221-row
-- import on its first surprise rather than logging it. Revisit once the import
-- has run and the column is known to be clean.
do $$
declare
  bad_age    int;
  bad_gender int;
begin
  select count(*) into bad_age from public.profiles
   where age_range is not null and age_range <> ''
     and age_range not in ('18-34', '35-44', '45-59', '60-plus');

  select count(*) into bad_gender from public.profiles
   where gender is not null and gender <> ''
     and gender not in ('female', 'male', 'non-binary', 'prefer-not-to-say');

  raise notice 'off-vocabulary rows remaining — age_range: %, gender: %', bad_age, bad_gender;
  raise notice 'age_range survivors are the ambiguous 30-39 / 40-49 buckets, left for the member to re-answer';
end $$;

commit;
