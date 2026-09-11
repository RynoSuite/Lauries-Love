-- Deleting a group deletes its posts.
--
-- `posts.group_id` was `on delete set null`, so removing a group turned every
-- post that had been shared to it into an ordinary wall post — visible to
-- everyone, with nothing left to say where it had been written. For a private
-- support group that is close to the opposite of what deleting it means: the
-- container disappears and its contents are published.
--
-- Decided 11 Sept: the posts go with the group, and the admin is told so
-- before confirming.
--
-- Enforced here rather than in the admin console, so the rule holds whatever
-- does the deleting — the console today, a script or a support agent
-- tomorrow. A rule that only exists in one caller is a rule until someone
-- writes a second caller.
--
-- What the cascade takes with it, without further work:
--   * comments        — `comments.post_id` is already `on delete cascade`
--   * reactions       — polymorphic with no foreign key, but the existing
--                       trg_posts_cleanup / trg_posts_cleanup_after pair fires
--                       per deleted post and clears both post and comment
--                       reactions (see 20260909120000)
--   * moderation      — trg_posts_close_moderation closes any still-pending
--                       report for a post as it goes (see 20260909160000)
--
-- Row triggers fire on cascaded deletes exactly as they do on direct ones,
-- which is why none of that needs repeating here.

alter table public.posts
  drop constraint if exists posts_group_id_fkey;

alter table public.posts
  add constraint posts_group_id_fkey
  foreign key (group_id)
  references public.groups(id)
  on delete cascade;

comment on constraint posts_group_id_fkey on public.posts is
  'Deleting a group deletes its posts. Previously ON DELETE SET NULL, which republished a private group''s posts to the whole community.';

-- How many posts each group would take with it, so the number in the admin
-- confirmation can be checked against the database.
select g.name, count(p.id) as posts
  from public.groups g
  left join public.posts p on p.group_id = g.id
 group by g.name
 order by posts desc;
