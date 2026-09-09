-- Close moderation reports when the reported content disappears.
--
-- `moderation_queue.entity_id` is polymorphic — one column pointing at either
-- a post or a comment — so it carries no foreign key and nothing cascades.
-- When a post is deleted by any route other than the moderation tool itself,
-- its pending report is left behind forever:
--
--   * the author deleted their own post
--   * an account was removed and its posts cascaded away
--   * a seed teardown removed demo content
--
-- The dashboard counts `status = 'pending'` rows, so each of those inflates
-- "Reports awaiting review" with something no moderator can act on — the
-- content is already gone. A queue that cannot be emptied is one people stop
-- trusting, which in a cancer community is the queue where a member in crisis
-- gets missed.
--
-- Two parts: a trigger so it cannot happen again, and a backfill for the rows
-- already stranded.
--
-- The report is closed as 'rejected' rather than deleted. `status` is
-- constrained to ('pending','approved','rejected'), and rejected is what
-- actually happened — the content is not there any more. Deleting the row
-- instead would erase the fact that something was reported at all, which is
-- the opposite of what a moderation log is for. The reason is annotated so a
-- moderator reading the history can tell this from a human decision.

create or replace function public.close_moderation_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.moderation_queue q
     set status = 'rejected',
         reviewed_at = now(),
         reason = coalesce(q.reason, '') || ' [closed automatically: content deleted before review]'
   where q.entity_type = tg_argv[0]
     and q.entity_id = old.id
     and q.status = 'pending';
  return null;
end $$;

revoke execute on function public.close_moderation_on_delete() from anon, authenticated, public;

-- AFTER, and on a different table than the one being deleted from. An earlier
-- BEFORE DELETE trigger on posts touched the dying row itself and produced
-- "tuple to be deleted was already modified" — see
-- 20260909120000_post_delete_trigger_fix_v1.sql. Nothing here writes to posts
-- or comments, so the two cannot collide.
drop trigger if exists trg_posts_close_moderation on public.posts;
create trigger trg_posts_close_moderation
  after delete on public.posts
  for each row execute function public.close_moderation_on_delete('post');

drop trigger if exists trg_comments_close_moderation on public.comments;
create trigger trg_comments_close_moderation
  after delete on public.comments
  for each row execute function public.close_moderation_on_delete('comment');

-- ------------------------------------------------------------------
-- Backfill: reports already pending against content that no longer exists.
-- ------------------------------------------------------------------
update public.moderation_queue q
   set status = 'rejected',
       reviewed_at = now(),
       reason = coalesce(q.reason, '') || ' [closed automatically: content deleted before review]'
 where q.status = 'pending'
   and (
     (q.entity_type = 'post'
      and not exists (select 1 from public.posts p where p.id = q.entity_id))
     or
     (q.entity_type = 'comment'
      and not exists (select 1 from public.comments c where c.id = q.entity_id))
   );

comment on function public.close_moderation_on_delete() is
  'Closes any still-pending moderation report for a post or comment that has just been deleted, so the queue cannot accumulate reports about content that no longer exists.';

-- What is genuinely left to review.
select status, count(*)
  from public.moderation_queue
 group by status
 order by status;
