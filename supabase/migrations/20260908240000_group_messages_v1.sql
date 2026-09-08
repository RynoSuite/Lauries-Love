-- Group message threads: several members in one conversation, Facebook-style.
--
-- The schema already carried everything needed (conversations.is_group,
-- conversation_members, messages keyed by conversation) because group CHAT,
-- one thread per community group, was built on it. What was missing is an
-- ad-hoc thread: a few people the member picked, with no group behind it.
--
-- Membership cannot be written from the client. conv_members_insert is
-- self-insert only, deliberately: an earlier policy let any creator force-add
-- any user in the system, which is a spam vector. So every membership change
-- here goes through a SECURITY DEFINER function that checks the relationship
-- first.
--
-- The rule for who may be added: an accepted friendship with whoever is doing
-- the adding. That matches how the client described it, group messages with
-- connected members, and means nobody can be pulled into a thread by a
-- stranger.

-- ============================================================
-- Who may be added by whom
-- ============================================================
create or replace function public.are_connected(a uuid, b uuid)
returns boolean language sql security definer set search_path = public, pg_temp stable as $$
  select exists (
    select 1 from public.friendships f
     where f.status = 'accepted'
       and ((f.requester_id = a and f.addressee_id = b)
         or (f.requester_id = b and f.addressee_id = a))
  );
$$;

revoke execute on function public.are_connected(uuid, uuid) from anon, public;
grant execute on function public.are_connected(uuid, uuid) to authenticated;

-- ============================================================
-- Create a thread
-- ============================================================
-- Returns the new conversation id. The caller is always a member; every other
-- id must be an accepted connection of the caller.
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
  -- Two other people minimum. One other person is a direct message, and
  -- find_or_create_direct_conversation already keeps those unique. Letting a
  -- group of two exist would create a second, parallel thread with the same
  -- person and split the conversation in half.
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

revoke execute on function public.create_group_conversation(text, uuid[]) from anon, public;
grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;

comment on function public.create_group_conversation(text, uuid[]) is
  'Creates an ad-hoc group thread. Members must be accepted connections of the caller. Membership is written here because the table only permits self-insert.';

-- ============================================================
-- Add someone to an existing thread
-- ============================================================
-- Any member may add, not only the creator: a thread whose creator goes quiet
-- would otherwise be frozen forever. The person added must be connected to
-- whoever is adding them.
create or replace function public.add_conversation_member(
  p_conversation_id uuid,
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := auth.uid();
  is_group_thread boolean;
  has_group uuid;
  member_count int;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  select c.is_group, c.group_id into is_group_thread, has_group
    from public.conversations c where c.id = p_conversation_id;
  if is_group_thread is null then
    raise exception 'conversation not found';
  end if;
  -- Direct threads are defined by their two people (direct_key depends on it).
  if not is_group_thread then
    raise exception 'cannot add members to a direct conversation';
  end if;
  -- A community group's own thread derives membership from group_members.
  if has_group is not null then
    raise exception 'membership of a group thread follows the group';
  end if;

  if not exists (select 1 from public.conversation_members
                  where conversation_id = p_conversation_id and profile_id = me) then
    raise exception 'you are not a member of this conversation';
  end if;

  if not public.are_connected(me, p_profile_id) then
    raise exception 'you can only add members you are connected with';
  end if;

  select count(*) into member_count from public.conversation_members
   where conversation_id = p_conversation_id;
  if member_count >= 50 then
    raise exception 'a group can hold at most 50 members';
  end if;

  insert into public.conversation_members (conversation_id, profile_id)
  values (p_conversation_id, p_profile_id)
  on conflict do nothing;
end;
$$;

revoke execute on function public.add_conversation_member(uuid, uuid) from anon, public;
grant execute on function public.add_conversation_member(uuid, uuid) to authenticated;

-- ============================================================
-- Leave a thread
-- ============================================================
-- Self-removal only. Nobody can be removed by another member: in a support
-- community that is a harm vector, and there is no moderator inside a private
-- thread to appeal to.
create or replace function public.leave_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := auth.uid();
  is_group_thread boolean;
  has_group uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  select c.is_group, c.group_id into is_group_thread, has_group
    from public.conversations c where c.id = p_conversation_id;
  if coalesce(is_group_thread, false) = false or has_group is not null then
    raise exception 'you can only leave an ad-hoc group conversation';
  end if;

  delete from public.conversation_members
   where conversation_id = p_conversation_id and profile_id = me;

  -- The messages stay. Other members are still reading the thread, and
  -- deleting one person's words out of a conversation rewrites it for
  -- everyone who remains.
end;
$$;

revoke execute on function public.leave_conversation(uuid) from anon, public;
grant execute on function public.leave_conversation(uuid) to authenticated;

-- ============================================================
-- Rename a thread
-- ============================================================
create or replace function public.rename_conversation(p_conversation_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from public.conversation_members
                  where conversation_id = p_conversation_id and profile_id = me) then
    raise exception 'you are not a member of this conversation';
  end if;
  update public.conversations
     set name = nullif(btrim(coalesce(p_name, '')), '')
   where id = p_conversation_id
     and is_group = true
     and group_id is null;
end;
$$;

revoke execute on function public.rename_conversation(uuid, text) from anon, public;
grant execute on function public.rename_conversation(uuid, text) to authenticated;

-- ============================================================
-- Who can I start a thread with
-- ============================================================
-- The caller's accepted connections, for the member picker. Returns only what
-- a picker needs: no email, no location, no diagnosis.
create or replace function public.my_connections()
returns table (id uuid, display_name text, first_name text, avatar_path text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.display_name, p.first_name, p.avatar_path
    from public.friendships f
    join public.profiles p
      on p.id = case when f.requester_id = auth.uid() then f.addressee_id
                     else f.requester_id end
   where f.status = 'accepted'
     and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
   order by coalesce(p.display_name, p.first_name);
$$;

revoke execute on function public.my_connections() from anon, public;
grant execute on function public.my_connections() to authenticated;

-- ============================================================
-- Group-aware message notifications
-- ============================================================
-- The fan-out was already correct: every member except the sender gets a row.
-- The wording was not. "Sarah sent you a message" is wrong when Sarah sent it
-- to five people, and it matters because the notification is often all someone
-- reads before deciding whether to open the app.
create or replace function public.notify_message()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare
  v_name text;
  v_is_group boolean;
  v_conv_name text;
  v_text text;
begin
  select coalesce(display_name, first_name, 'Someone') into v_name
    from public.profiles where id = new.sender_id;

  select c.is_group, c.name into v_is_group, v_conv_name
    from public.conversations c where c.id = new.conversation_id;

  if coalesce(v_is_group, false) then
    v_text := coalesce(v_name, 'Someone') || ' posted in '
              || coalesce(nullif(btrim(coalesce(v_conv_name, '')), ''), 'a group conversation');
  else
    v_text := coalesce(v_name, 'Someone') || ' sent you a message';
  end if;

  insert into public.notifications (recipient_id, sender_id, entity_type, content, meta)
  select cm.profile_id, new.sender_id, 'MESSAGE', v_text,
         jsonb_build_object('conversationId', new.conversation_id, 'messageId', new.id)
  from public.conversation_members cm
  where cm.conversation_id = new.conversation_id
    and cm.profile_id <> new.sender_id;
  return null;
end $$;
