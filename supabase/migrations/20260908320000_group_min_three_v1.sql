-- Restore the three-person minimum for group threads.
--
-- 20260908300000 lowered it to two, then that was reversed the same day.
-- Written as a new migration rather than by editing the old one, because the
-- old one may already have been applied and a migration that changes after it
-- has run is worse than an extra file.
--
-- The reason for three: with one other person a group thread duplicates a
-- direct message. Direct messages are unique by direct_key; group threads are
-- not, so nothing stops several two-person groups existing alongside the
-- direct thread with the same member. All of them accept messages, none of
-- them know about the others, and a reply lands in whichever one happened to
-- be open. In a support community, a message someone believes they sent and
-- nobody reads is a bad failure.
--
-- Safe to run whether or not 20260908300000 was applied.
create or replace function public.create_group_conversation(
  p_name text,
  p_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := auth.uid();
  conv uuid;
  other uuid;
  n int;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  -- Deduplicate, and drop the caller if they included themselves.
  select array_agg(distinct x) into p_member_ids
    from unnest(coalesce(p_member_ids, array[]::uuid[])) as x
   where x <> me;

  n := coalesce(array_length(p_member_ids, 1), 0);
  -- Two others minimum: with one, use a direct message, which already exists
  -- and stays unique.
  if n < 2 then
    raise exception 'a group needs at least two other members';
  end if;
  -- A ceiling, because every member multiplies the notification fan-out and
  -- there is no moderator inside a private thread.
  if n > 49 then
    raise exception 'a group can hold at most 50 members';
  end if;

  foreach other in array p_member_ids loop
    if not public.are_connected(me, other) then
      raise exception 'you can only add members you are connected with';
    end if;
  end loop;

  insert into public.conversations (is_group, name, created_by, last_message_at)
  values (true, nullif(btrim(coalesce(p_name, '')), ''), me, now())
  returning id into conv;

  insert into public.conversation_members (conversation_id, profile_id)
  select conv, me
  union all
  select conv, x from unnest(p_member_ids) as x;

  return conv;
end;
$$;

comment on function public.create_group_conversation(text, uuid[]) is
  'Creates an ad-hoc group thread of three or more people. Members must be accepted connections of the caller. Membership is written here because the table only permits self-insert.';

-- If a two-person group was created while the lower minimum was live, it still
-- exists and still works: this only governs what can be created from now on.
-- Nothing is deleted here, because deleting a conversation someone has already
-- used would take their messages with it.
