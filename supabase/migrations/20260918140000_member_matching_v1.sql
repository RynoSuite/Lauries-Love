-- Member matching: a swipe deck that makes connections.
--
-- Client request, Sept 2026: a swipe surface, reached from the map, as another
-- way for members to find each other. Free and unlimited — no tiers, no daily
-- quota, no paid ranking.
--
-- ── A match IS a friendship ────────────────────────────────────────────────
--
-- There is no `matches` table. When two members like each other the result is a
-- row in `friendships` with status 'accepted', because that is what every other
-- surface already reads: messaging, `my_connections`, the group-thread picker
-- and the friend count on a profile. A separate matches table would mean two
-- half-connections that each of those has to learn about.
--
-- The consequence is the one the client asked for: a match is immediate. No
-- request, no acceptance step, no notification saying someone wants to connect.
-- They can message each other the moment it happens.
--
-- ── Why likes are private ──────────────────────────────────────────────────
--
-- A like is invisible until it is returned. Nobody learns they were passed
-- over, and nobody has to decline anyone. In a community of people with cancer
-- that matters more than it would elsewhere: a visible pending request that is
-- never accepted is a small rejection, repeated every time you open the app.

-- ---------------------------------------------------------------------------
-- swipes
-- ---------------------------------------------------------------------------
create table if not exists public.swipes (
  actor_id   uuid not null references public.profiles(id) on delete cascade,
  target_id  uuid not null references public.profiles(id) on delete cascade,
  direction  text not null check (direction in ('like','pass')),
  created_at timestamptz not null default now(),

  -- One decision per pair. This is also the deck's exclusion index: "everyone I
  -- have not decided on yet" becomes an index-only anti-join.
  primary key (actor_id, target_id),
  constraint swipes_not_self check (actor_id <> target_id)
);

-- Answers "who liked me", which is the reciprocity check at swipe time.
create index if not exists idx_swipes_target_like
  on public.swipes (target_id) where direction = 'like';

alter table public.swipes enable row level security;

-- A member sees only their own decisions. Critically they may NOT read rows
-- where they are the target: that would expose who liked them before they
-- liked back, which is the whole point of keeping likes private.
drop policy if exists swipes_select on public.swipes;
create policy swipes_select on public.swipes for select to authenticated
  using (actor_id = auth.uid());

-- Writes go through record_swipe() below, which is SECURITY DEFINER. No direct
-- insert policy: a member must not be able to forge a swipe as someone else,
-- and the function is the only place the match rule is applied.
drop policy if exists swipes_delete on public.swipes;
create policy swipes_delete on public.swipes for delete to authenticated
  using (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- record_swipe
-- ---------------------------------------------------------------------------
-- Records a decision and, on a mutual like, creates the connection.
--
-- Returns `matched` so the client can show the moment immediately rather than
-- refetching and hoping.
create or replace function public.record_swipe(target uuid, dir text)
returns table (matched boolean, friendship_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  reciprocated boolean;
  existing public.friendships%rowtype;
  fid uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if target = me then raise exception 'cannot swipe on yourself'; end if;
  if dir not in ('like','pass') then raise exception 'direction must be like or pass'; end if;

  -- A repeat swipe updates the decision rather than failing. Changing your mind
  -- is not an error, and a pass that can never be undone is a permanent
  -- exclusion the member did not know they were choosing.
  insert into public.swipes (actor_id, target_id, direction)
  values (me, target, dir)
  on conflict (actor_id, target_id)
  do update set direction = excluded.direction, created_at = now();

  if dir <> 'like' then
    return query select false, null::uuid;
    return;
  end if;

  select exists (
    select 1 from public.swipes
     where actor_id = target and target_id = me and direction = 'like'
  ) into reciprocated;

  if not reciprocated then
    return query select false, null::uuid;
    return;
  end if;

  -- Mutual. Promote whatever relationship exists to an accepted friendship.
  -- `friendships` holds one row per pair in whichever direction it was created,
  -- so look both ways before inserting or the unique constraint rejects it.
  select * into existing from public.friendships
   where (requester_id = me and addressee_id = target)
      or (requester_id = target and addressee_id = me)
   limit 1;

  if found then
    -- Covers the case where one of them had already sent a friend request the
    -- ordinary way: the mutual like accepts it.
    update public.friendships
       set status = 'accepted', updated_at = now()
     where id = existing.id and status <> 'accepted'
    returning id into fid;
    if fid is null then fid := existing.id; end if;
  else
    insert into public.friendships (requester_id, addressee_id, status)
    values (me, target, 'accepted')
    returning id into fid;
  end if;

  return query select true, fid;
end $$;

revoke execute on function public.record_swipe(uuid, text) from anon, public;
grant execute on function public.record_swipe(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- match_deck
-- ---------------------------------------------------------------------------
-- The deck, best match first.
--
-- ── Scoring ────────────────────────────────────────────────────────────────
--
-- Weights, and why each is where it is:
--
--   shared diagnosis     12  The strongest signal there is. Someone with your
--                            cancer has been where you are.
--   diagnosis year ±1     8  Same disease and same phase. A 2026 diagnosis and
--   diagnosis year ±3     4  a 2009 one are very different days.
--   same state            6  Location matters, but as a nudge.
--   within ~50 miles     +4  On top of state, where both have coordinates.
--   same age range        3  Mild.
--
-- Location is deliberately NOT a filter. This community is 2,200 people spread
-- across the United States; gating the deck on proximity would leave most
-- members with nobody, and an empty deck is indistinguishable from a broken
-- one. A far-away match is still a match.
--
-- Everything is a bonus, never a penalty. A member with no diagnosis recorded
-- scores lower but still appears — being excluded for a blank field is how
-- people silently vanish from each other's decks.
create or replace function public.match_deck(limit_count int default 20)
returns table (
  id uuid,
  display_name text,
  first_name text,
  avatar_path text,
  city text,
  state text,
  description text,
  age_range text,
  diagnosis_year text,
  diagnosis_type_ids uuid[],
  diagnosis_subtype_ids uuid[],
  role_id uuid,
  shared_diagnosis_ids uuid[],
  same_state boolean,
  distance_miles double precision,
  score int
)
language sql security definer set search_path = public stable as $$
  with me as (
    select p.id, p.age_range, p.state, p.latitude, p.longitude,
           p.diagnosis_type_ids, p.diagnosis_year
      from public.profiles p where p.id = auth.uid()
  )
  select c.id, c.display_name, c.first_name, c.avatar_path, c.city, c.state,
         c.description, c.age_range, c.diagnosis_year,
         c.diagnosis_type_ids, c.diagnosis_subtype_ids, c.role_id,
         shared.ids as shared_diagnosis_ids,
         (c.state is not null and c.state = m.state) as same_state,
         dist.miles as distance_miles,
         (
           cardinality(shared.ids) * 12
           + case
               when c.diagnosis_year is null or m.diagnosis_year is null then 0
               when abs(
                 nullif(regexp_replace(c.diagnosis_year, '\D', '', 'g'), '')::int
                 - nullif(regexp_replace(m.diagnosis_year, '\D', '', 'g'), '')::int
               ) <= 1 then 8
               when abs(
                 nullif(regexp_replace(c.diagnosis_year, '\D', '', 'g'), '')::int
                 - nullif(regexp_replace(m.diagnosis_year, '\D', '', 'g'), '')::int
               ) <= 3 then 4
               else 0
             end
           + case when c.state is not null and c.state = m.state then 6 else 0 end
           + case when dist.miles is not null and dist.miles <= 50 then 4 else 0 end
           + case when c.age_range is not null and c.age_range = m.age_range then 3 else 0 end
         )::int as score
    from public.profiles c
    cross join me m
    -- The overlap is computed once and reused by both the score and the card,
    -- which shows the member WHY they were matched.
    cross join lateral (
      select coalesce(array(
        select unnest(c.diagnosis_type_ids)
        intersect
        select unnest(m.diagnosis_type_ids)
      ), '{}'::uuid[]) as ids
    ) shared
    -- Great-circle distance, only where both sides have a location. Coordinates
    -- are already coarsened to a ~3.5 mile grid before they are stored, so this
    -- is no more precise than the app is anywhere else.
    cross join lateral (
      select case
        when c.latitude is null or m.latitude is null then null
        else 3959 * acos(greatest(-1, least(1,
               cos(radians(m.latitude)) * cos(radians(c.latitude))
             * cos(radians(c.longitude) - radians(m.longitude))
             + sin(radians(m.latitude)) * sin(radians(c.latitude))
           )))
      end as miles
    ) dist
   where c.id <> m.id
     and c.active
     -- Already decided on. A pass is an exclusion, not a demotion: someone you
     -- passed should stop appearing.
     and not exists (
       select 1 from public.swipes s where s.actor_id = m.id and s.target_id = c.id
     )
     -- Already connected. This surface exists to CREATE connections, so
     -- offering someone you can already message is offering a result you have.
     and not exists (
       select 1 from public.friendships f
        where f.status = 'accepted'
          and ((f.requester_id = m.id and f.addressee_id = c.id)
            or (f.requester_id = c.id and f.addressee_id = m.id))
     )
   -- `id` last makes the order total: without it, equal-scoring rows can swap
   -- between fetches and the deck repeats or skips people.
   order by score desc, c.id
   limit greatest(1, least(limit_count, 50));
$$;

revoke execute on function public.match_deck(int) from anon, public;
grant execute on function public.match_deck(int) to authenticated;
