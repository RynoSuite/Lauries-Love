-- Fix: deleting a post fails with
--   "tuple to be deleted was already modified by an operation triggered by
--    the current command"
--
-- The chain:
--   1. delete from posts where id = X
--   2. BEFORE DELETE trigger trg_posts_cleanup runs cleanup_post_relations(),
--      which deletes that post's rows from `reactions` (they are polymorphic,
--      with no foreign key, so nothing cascades them)
--   3. deleting those reactions fires bump_post_like_count(), which runs
--      update posts set like_count = ... where id = X
--   4. that update touches the very row being deleted, from inside its own
--      BEFORE DELETE trigger — which Postgres refuses
--
-- Postgres suggests an AFTER trigger, and that is right for the post's own
-- reactions: once the row is gone, the like_count update matches nothing and
-- quietly does nothing, which is the desired outcome.
--
-- But it is wrong for the COMMENTS' reactions. Comments cascade away with the
-- post, so by AFTER time `select id from comments where post_id = old.id`
-- returns nothing and every like on every reply is orphaned. Those have to be
-- cleared while the comments still exist.
--
-- So the work is split: comment reactions before, the post's own after.
--
-- This affected every delete path, not just moderation — a member removing
-- their own post hit the same error.

-- ------------------------------------------------------------------
-- BEFORE: the comments' reactions, while the comments are still there.
-- ------------------------------------------------------------------
create or replace function public.cleanup_post_relations()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- bump_post_like_count only updates posts for entity_type = 'post', so
  -- clearing comment reactions here touches nothing that is mid-delete.
  delete from public.reactions
    where entity_type = 'comment'
      and entity_id in (select id from public.comments where post_id = old.id);
  return old;
end $$;

revoke execute on function public.cleanup_post_relations() from anon, authenticated, public;

drop trigger if exists trg_posts_cleanup on public.posts;
create trigger trg_posts_cleanup
  before delete on public.posts
  for each row execute function public.cleanup_post_relations();

-- ------------------------------------------------------------------
-- AFTER: the post's own reactions, once the row it counts is gone.
-- ------------------------------------------------------------------
create or replace function public.cleanup_post_reactions_after()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.reactions
    where entity_type = 'post' and entity_id = old.id;
  return null;
end $$;

revoke execute on function public.cleanup_post_reactions_after() from anon, authenticated, public;

drop trigger if exists trg_posts_cleanup_after on public.posts;
create trigger trg_posts_cleanup_after
  after delete on public.posts
  for each row execute function public.cleanup_post_reactions_after();

comment on function public.cleanup_post_reactions_after() is
  'Clears a deleted post''s reactions AFTER the row is gone, so the like_count trigger has nothing to update and cannot conflict with the delete.';

-- ------------------------------------------------------------------
-- Tidy: reactions left behind by posts deleted before this fix.
-- ------------------------------------------------------------------
delete from public.reactions r
 where r.entity_type = 'post'
   and not exists (select 1 from public.posts p where p.id = r.entity_id);

delete from public.reactions r
 where r.entity_type = 'comment'
   and not exists (select 1 from public.comments c where c.id = r.entity_id);
