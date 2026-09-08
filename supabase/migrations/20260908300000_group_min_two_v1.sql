-- Allow a group thread of two: the caller plus one other member.
--
-- v1 required two others, on the reasoning that a thread with one other
-- person is a direct message and those are already kept unique by
-- direct_key. That is still true, and the consequence is worth writing down:
-- a two-person group and a direct message with the same person are now two
-- separate threads, both of which can carry messages, and neither knows about
-- the other. Someone can reply in the wrong one.
--
-- Accepted deliberately. A named two-person thread is a real thing people
-- want — a side conversation about one topic, kept apart from the running
-- direct thread — and the client asked for it.
--
-- Only the minimum changes. Everything else about who may be added, who may
-- add, and who may remove stays exactly as it was.
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
  -- One other person minimum, so a group is at least two people.
  if n < 1 then
    raise exception 'pick at least one other member';
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
  'Creates an ad-hoc group thread of two or more people. Members must be accepted connections of the caller. Membership is written here because the table only permits self-insert.';
