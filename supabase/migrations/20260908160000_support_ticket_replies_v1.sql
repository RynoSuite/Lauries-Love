-- Support replies.
--
-- support_tickets has carried a conversation_id since it was created, and the
-- admin inbox has told staff to "reply in the linked conversation" — but
-- nothing ever set it. A member could open a ticket and there was no way on
-- any surface to answer them. This wires up the design that was always
-- intended rather than inventing a second messaging system.
--
-- Replying opens (or reuses) a direct conversation between the staff member
-- and the member, so the answer arrives in the place the member already
-- checks: Messages, on web and on mobile, with realtime and push already
-- working. The ticket's original text is seeded into the thread the first time
-- so the conversation makes sense on its own.

create or replace function public.support_ticket_reply(
  p_ticket_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := (select auth.uid());
  t  record;
  conv uuid;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_support_staff() then
    raise exception 'support staff access required';
  end if;

  p_body := trim(coalesce(p_body, ''));
  if p_body = '' then
    raise exception 'reply cannot be empty';
  end if;
  if char_length(p_body) > 4000 then
    raise exception 'reply too long';
  end if;

  select id, user_id, subject, description, conversation_id
    into t
    from public.support_tickets
   where id = p_ticket_id;

  if not found then
    raise exception 'ticket not found';
  end if;

  -- A member cannot be their own support agent; that would create a
  -- self-conversation the messages UI has no sensible way to render.
  if t.user_id = me then
    raise exception 'cannot reply to your own ticket';
  end if;

  conv := t.conversation_id;

  if conv is null then
    insert into public.conversations (is_group, name, created_by, last_message_at)
    values (false, 'Support: ' || left(t.subject, 120), me, now())
    returning id into conv;

    insert into public.conversation_members (conversation_id, profile_id)
    values (conv, me), (conv, t.user_id)
    on conflict do nothing;

    -- Seed the thread with what the member actually wrote, attributed to them,
    -- so the staff reply has context and the member recognises the thread.
    insert into public.messages (conversation_id, sender_id, body, created_at)
    values (conv, t.user_id, t.subject || E'\n\n' || t.description, now());

    update public.support_tickets
       set conversation_id = conv,
           updated_at = now()
     where id = t.id;
  end if;

  insert into public.messages (conversation_id, sender_id, body)
  values (conv, me, p_body);

  update public.conversations set last_message_at = now() where id = conv;
  update public.support_tickets set updated_at = now() where id = t.id;

  return conv;
end;
$$;

revoke all on function public.support_ticket_reply(uuid, text) from public, anon;
grant execute on function public.support_ticket_reply(uuid, text) to authenticated;

comment on function public.support_ticket_reply(uuid, text) is
  'Staff reply to a support ticket. Opens or reuses a direct conversation with the member and posts the reply there, so the answer lands in Messages where the member already looks.';


-- Staff need to read the thread they are replying to. Conversation membership
-- is normally self-only; this adds a narrow path for support staff limited to
-- conversations that are actually attached to a ticket.
drop policy if exists messages_support_staff_select on public.messages;
create policy messages_support_staff_select on public.messages for select to authenticated
  using (
    public.is_support_staff()
    and exists (
      select 1 from public.support_tickets st
      where st.conversation_id = messages.conversation_id
    )
  );

drop policy if exists conversations_support_staff_select on public.conversations;
create policy conversations_support_staff_select on public.conversations for select to authenticated
  using (
    public.is_support_staff()
    and exists (
      select 1 from public.support_tickets st
      where st.conversation_id = conversations.id
    )
  );
