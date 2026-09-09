-- Let a member remove a conversation from their own list.
--
-- leave_conversation() only accepts ad-hoc group threads, so there was no way
-- to clear a direct message. The app now offers swipe-to-delete on the
-- conversation list and needs something to call.
--
-- IMPORTANT: this removes the thread for the CALLER only. It deletes their
-- conversation_members row; the other person keeps the conversation and every
-- message in it. Deleting a shared thread outright would let one person erase
-- another's messages, which in a support community is a way to remove evidence
-- of harassment, not a convenience.
--
-- A community group's own thread is refused: membership there follows
-- group_members, so leaving the chat without leaving the group would put the
-- member in a group whose conversation they cannot see, and the next
-- membership sync would silently put them back.

create or replace function public.leave_any_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := auth.uid();
  has_group uuid;
  found_row boolean;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;

  select c.group_id, true into has_group, found_row
    from public.conversations c
   where c.id = p_conversation_id;

  if not coalesce(found_row, false) then
    raise exception 'conversation not found';
  end if;

  if has_group is not null then
    raise exception 'leave the group itself to leave its conversation';
  end if;

  delete from public.conversation_members
   where conversation_id = p_conversation_id
     and profile_id = me;

  -- Once nobody is left, the thread is unreachable by anyone: remove it so it
  -- does not sit in the database forever with its messages.
  delete from public.conversations c
   where c.id = p_conversation_id
     and not exists (
       select 1 from public.conversation_members cm
        where cm.conversation_id = c.id
     );
end;
$$;

revoke execute on function public.leave_any_conversation(uuid) from anon, public;
grant execute on function public.leave_any_conversation(uuid) to authenticated;

comment on function public.leave_any_conversation(uuid) is
  'Removes a conversation from the caller''s list only. Other members keep the thread and its messages. Refuses a community group''s own conversation.';
