-- Make member accounts deletable.
--
-- Two foreign keys pointed at `profiles(id)` with no ON DELETE behaviour, which
-- in Postgres means NO ACTION — the delete is REFUSED:
--
--   conversations.created_by
--   groups.created_by
--
-- Everything else referencing profiles already cascades or nulls. These two
-- were missed, and the consequence is not theoretical: **anyone who has ever
-- started a direct message cannot be deleted.** `find_or_create_direct_
-- conversation` sets created_by, so that is most members who have used the app
-- at all. The `delete-account` edge function would fail for them, and the error
-- Supabase surfaces is a bare "Database error deleting user" with nothing
-- naming the constraint.
--
-- Found on 18 Sept while removing two test accounts, which refused to delete
-- for exactly this reason.
--
-- ── Why SET NULL and not CASCADE ───────────────────────────────────────────
--
-- Cascade would delete the conversation when its creator leaves, taking the
-- other person's messages with it — one member's deletion erasing another
-- member's history. Same for a group: the creator leaving must not delete the
-- group and everyone's posts in it.
--
-- Nulling is safe for access. The conversations SELECT policy is
-- `created_by = auth.uid() OR is_conversation_member(id)`, so the remaining
-- participant keeps the thread through membership. Both columns were already
-- nullable, so nothing else has to change.

begin;

alter table public.conversations
  drop constraint if exists conversations_created_by_fkey;
alter table public.conversations
  add constraint conversations_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.groups
  drop constraint if exists groups_created_by_fkey;
alter table public.groups
  add constraint groups_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- Anything else still refusing a profile delete? Reported rather than assumed:
-- this was missed once by reading the schema, so the check asks the database.
do $$
declare
  offender record;
  found_any boolean := false;
begin
  for offender in
    select rel.relname as table_name, att.attname as column_name, con.conname
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_attribute att
        on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
     where con.contype = 'f'
       and con.confrelid = 'public.profiles'::regclass
       -- 'a' is NO ACTION, 'r' is RESTRICT. Both block a delete.
       and con.confdeltype in ('a', 'r')
       and array_length(con.conkey, 1) = 1
  loop
    found_any := true;
    raise notice 'STILL BLOCKS DELETION: %.% (%)',
      offender.table_name, offender.column_name, offender.conname;
  end loop;

  if not found_any then
    raise notice 'No foreign key to profiles blocks a delete. Accounts are deletable.';
  end if;
end $$;

commit;
