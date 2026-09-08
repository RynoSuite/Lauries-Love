-- Let people edit and delete what they wrote.
--
-- Posts already had author update/delete policies. Messages had neither: once
-- sent, a message could not be corrected or taken back by anyone, which is a
-- poor deal in a support community where people share things in the moment and
-- sometimes think better of it.
--
-- Edits are marked rather than silent. In a community where members reply to
-- each other about their health, being able to quietly rewrite a message after
-- someone has answered it is a trust problem, not a feature. The UI shows
-- "edited" wherever this is set.

alter table public.posts
  add column if not exists edited_at timestamptz;

alter table public.messages
  add column if not exists edited_at timestamptz;

comment on column public.posts.edited_at is
  'Set when the author edits the post. Surfaced in the UI so an edit is never silent.';
comment on column public.messages.edited_at is
  'Set when the sender edits the message. Surfaced in the UI so an edit is never silent.';

-- Senders may edit and delete their own messages. Deliberately NOT extended to
-- staff: support agents reading a ticket thread should never be able to alter
-- what a member said.
drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages for update to authenticated
  using (sender_id = (select auth.uid()))
  with check (sender_id = (select auth.uid()));

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages for delete to authenticated
  using (sender_id = (select auth.uid()));

-- Comments could be deleted but not corrected; a typo meant deleting and
-- reposting, which orphans any replies underneath.
drop policy if exists comments_update_own on public.comments;
create policy comments_update_own on public.comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

alter table public.comments
  add column if not exists edited_at timestamptz;


-- ------------------------------------------------------------------
-- Unread counts for the nav badges.
--
-- Notifications are countable directly (read_at is null), but unread messages
-- are not: the read marker lives on conversation_members while the messages
-- live in another table, and a member cannot select rows in conversations they
-- do not belong to. One staff-free, self-scoped function returns both.
-- ------------------------------------------------------------------
create or replace function public.my_unread_counts()
returns json
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select json_build_object(
    'notifications', (
      select count(*) from public.notifications
      where recipient_id = (select auth.uid()) and read_at is null
    ),
    'messages', (
      -- Messages in my conversations, newer than my last read of that
      -- conversation, that I did not send myself.
      select count(*)
      from public.messages m
      join public.conversation_members cm
        on cm.conversation_id = m.conversation_id
       and cm.profile_id = (select auth.uid())
      where m.sender_id <> (select auth.uid())
        and (cm.last_read_at is null or m.created_at > cm.last_read_at)
    )
  );
$$;

revoke all on function public.my_unread_counts() from public, anon;
grant execute on function public.my_unread_counts() to authenticated;

comment on function public.my_unread_counts() is
  'Unread notification and message counts for the calling member. Self-scoped: reads only the caller''s own rows.';


-- Mark a conversation read. Needed because conversation_members has no update
-- policy, so a member cannot move their own read marker.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversation_members
     set last_read_at = now()
   where conversation_id = p_conversation_id
     and profile_id = (select auth.uid());
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
