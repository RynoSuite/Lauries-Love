-- Threaded comment replies.
--
-- comments has only ever been flat: post_id, author_id, body. Members can
-- comment on a post but not answer each other, which is the interaction people
-- expect from anything that looks like a feed.
--
-- Deliberately ONE level deep. parent_id points at a top-level comment and a
-- reply cannot itself be replied to. Unbounded nesting produces threads that
-- cannot be rendered legibly on a phone, and every mature social product has
-- ended up collapsing to this shape. Enforced by a trigger, not just by the UI.

alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade;

create index if not exists idx_comments_parent on public.comments (parent_id, created_at);

comment on column public.comments.parent_id is
  'Top-level comment this is a reply to. One level only; enforced by comments_reply_depth.';

-- Keep replies one level deep, and keep a reply on the same post as its parent.
create or replace function public.comments_enforce_reply_shape()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  parent record;
begin
  if new.parent_id is null then
    return new;
  end if;

  select id, post_id, parent_id into parent
    from public.comments where id = new.parent_id;

  if not found then
    raise exception 'parent comment not found';
  end if;
  if parent.parent_id is not null then
    raise exception 'replies are one level deep';
  end if;
  if parent.post_id <> new.post_id then
    raise exception 'reply must be on the same post as its parent';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_reply_shape on public.comments;
create trigger comments_reply_shape
  before insert or update of parent_id on public.comments
  for each row execute function public.comments_enforce_reply_shape();
