-- Make moderation actually moderate.
--
-- Rejecting an item only ever updated moderation_queue.status. The reported
-- post or comment stayed exactly where it was, visible to everyone, while the
-- admin page told the moderator "reject to remove it". A moderation tool that
-- silently does nothing is worse than none: staff believe the report is dealt
-- with and stop looking.
--
-- Staff cannot delete another member's content directly — posts_delete and
-- comments_delete are scoped to the author, which is correct and should stay
-- that way. This function is the one narrow, audited exception.

create or replace function public.moderation_resolve(
  p_queue_id uuid,
  p_action text  -- 'approve' | 'reject'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  me uuid := (select auth.uid());
  q  record;
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  if not public.is_support_staff() then
    raise exception 'staff access required';
  end if;
  if p_action not in ('approve', 'reject') then
    raise exception 'action must be approve or reject';
  end if;

  select id, entity_type, entity_id, status
    into q
    from public.moderation_queue
   where id = p_queue_id;

  if not found then
    raise exception 'queue item not found';
  end if;

  -- Rejecting removes the content. Deleting the post cascades to its comments
  -- and reactions, which is what "remove it" has to mean.
  if p_action = 'reject' then
    if q.entity_type = 'post' then
      delete from public.posts where id = q.entity_id;
    elsif q.entity_type = 'comment' then
      delete from public.comments where id = q.entity_id;
    end if;
  end if;

  update public.moderation_queue
     set status = case when p_action = 'approve' then 'approved' else 'rejected' end,
         reviewed_by = me,
         reviewed_at = now()
   where id = p_queue_id;

  -- Any other open report against the same thing is now moot. Leaving them
  -- pending means the next moderator opens a report on content that is gone.
  update public.moderation_queue
     set status = case when p_action = 'approve' then 'approved' else 'rejected' end,
         reviewed_by = me,
         reviewed_at = now()
   where entity_type = q.entity_type
     and entity_id = q.entity_id
     and status = 'pending';
end;
$$;

revoke all on function public.moderation_resolve(uuid, text) from public, anon;
grant execute on function public.moderation_resolve(uuid, text) to authenticated;

comment on function public.moderation_resolve(uuid, text) is
  'Staff resolve a moderation report. Reject deletes the reported post or comment; approve keeps it. Both close every other pending report on the same item.';


-- ------------------------------------------------------------------
-- Let the queue show what was actually reported.
--
-- The page listed entity_type and an id, so a moderator decided blind. Staff
-- can read posts and comments already, but not in one query joined to the
-- queue, because the queue stores a polymorphic entity_id with no foreign key.
-- ------------------------------------------------------------------
-- Adding post_id below changes the return type, which create-or-replace cannot
-- do, so drop first. Safe to re-run.
drop function if exists public.moderation_queue_detailed(integer);

create function public.moderation_queue_detailed(p_limit integer default 100)
returns table (
  id uuid,
  entity_type text,
  entity_id uuid,
  reason text,
  score numeric,
  -- 'ai' | 'user' — who raised it, not a profile id.
  flagged_by text,
  status text,
  created_at timestamptz,
  content text,
  author_id uuid,
  author_name text,
  content_exists boolean,
  -- The post to open when reviewing this report. For a reported comment that
  -- is the post the comment hangs under, so staff land on the conversation in
  -- context rather than on a comment with no surroundings.
  post_id uuid
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select q.id, q.entity_type, q.entity_id, q.reason, q.score, q.flagged_by,
         q.status, q.created_at,
         coalesce(p.body, c.body)                              as content,
         -- The queue stores author_id at flag time; fall back to it so a
         -- deleted post still shows who wrote it.
         coalesce(p.author_id, c.author_id, q.author_id)        as author_id,
         coalesce(pa.display_name, pa.first_name,
                  ca.display_name, ca.first_name,
                  qa.display_name, qa.first_name)              as author_name,
         (p.id is not null or c.id is not null)                as content_exists,
         coalesce(p.id, c.post_id)                             as post_id
    from public.moderation_queue q
    left join public.posts    p  on q.entity_type = 'post'    and p.id = q.entity_id
    left join public.comments c  on q.entity_type = 'comment' and c.id = q.entity_id
    left join public.profiles pa on pa.id = p.author_id
    left join public.profiles ca on ca.id = c.author_id
    left join public.profiles qa on qa.id = q.author_id
   where public.is_support_staff()
     and q.status = 'pending'
   order by q.created_at desc
   limit least(greatest(coalesce(p_limit, 100), 1), 500);
$$;

revoke all on function public.moderation_queue_detailed(integer) from public, anon;
grant execute on function public.moderation_queue_detailed(integer) to authenticated;

comment on function public.moderation_queue_detailed(integer) is
  'Pending moderation reports with the reported text and its author, so staff can judge without opening the content elsewhere. Staff-gated.';
