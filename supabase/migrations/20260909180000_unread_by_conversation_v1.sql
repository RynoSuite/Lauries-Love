-- Unread counts per conversation, for the thread list.
--
-- `my_unread_counts()` returns one total, which is enough for a badge on the
-- Messages tab but not for the list itself: a member looking at eight threads
-- needs to know WHICH one is waiting for them, and the row already has the
-- styling for it — the count was simply hardcoded to zero in the mobile
-- mapping because nothing could supply it.
--
-- It has to be a function for the same reason the total does: the read marker
-- lives on conversation_members and the messages live in another table, and a
-- member cannot select rows in conversations they do not belong to. Scoped to
-- the caller, so there is nothing to leak.
--
-- Conversations with nothing unread are simply absent from the result rather
-- than returning zero rows for every thread the member has ever joined.

create or replace function public.my_unread_by_conversation()
returns table (conversation_id uuid, unread_count integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.conversation_id, count(*)::int as unread_count
    from public.messages m
    join public.conversation_members cm
      on cm.conversation_id = m.conversation_id
     and cm.profile_id = (select auth.uid())
   where m.sender_id <> (select auth.uid())
     and (cm.last_read_at is null or m.created_at > cm.last_read_at)
   group by m.conversation_id;
$$;

revoke all on function public.my_unread_by_conversation() from public, anon;
grant execute on function public.my_unread_by_conversation() to authenticated;

comment on function public.my_unread_by_conversation() is
  'Unread message count per conversation for the caller. Conversations with nothing unread are omitted.';

select conversation_id, unread_count from public.my_unread_by_conversation();
