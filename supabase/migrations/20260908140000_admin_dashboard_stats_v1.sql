-- Aggregates for the admin dashboard.
--
-- Most dashboard numbers are plain counts the admin console can read directly.
-- Two useful ones cannot be: device split and push adoption live in
-- profiles_private, which is owner-only by design (it holds email, phone, zip
-- and push tokens). Rather than loosen that RLS, this returns COUNTS ONLY —
-- no row ever leaves the function, so staff learn "41 on iOS" without gaining
-- the ability to read anyone's phone number.
--
-- Also returns engagement figures that are genuinely derivable from Postgres,
-- so the dashboard stops advertising metrics it does not have. Session length
-- and retention still need a real analytics pipeline; they are not faked here.

create or replace function public.admin_dashboard_stats()
returns json
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result json;
begin
  -- Staff only. SECURITY DEFINER bypasses RLS, so the gate has to be explicit.
  if not public.is_support_staff() then
    raise exception 'staff access required';
  end if;

  select json_build_object(
    'members_total',        (select count(*) from public.profiles),
    'members_active_flag',  (select count(*) from public.profiles where active),
    'members_new_30d',      (select count(*) from public.profiles
                              where created_at > now() - interval '30 days'),
    'members_new_7d',       (select count(*) from public.profiles
                              where created_at > now() - interval '7 days'),

    -- "Engaged" = posted or commented in the window. This is the closest
    -- honest proxy for an active user without event tracking; it undercounts
    -- people who only read, and that is stated in the UI.
    'engaged_30d', (
      select count(distinct author_id) from (
        select author_id, created_at from public.posts
        union all
        select author_id, created_at from public.comments
      ) a where a.created_at > now() - interval '30 days'
    ),
    'engaged_7d', (
      select count(distinct author_id) from (
        select author_id, created_at from public.posts
        union all
        select author_id, created_at from public.comments
      ) a where a.created_at > now() - interval '7 days'
    ),

    'posts_total',    (select count(*) from public.posts),
    'posts_7d',       (select count(*) from public.posts
                        where created_at > now() - interval '7 days'),
    'comments_total', (select count(*) from public.comments),
    'groups_total',   (select count(*) from public.groups),
    'conversations_total', (select count(*) from public.conversations),
    'messages_7d',    (select count(*) from public.messages
                        where created_at > now() - interval '7 days'),

    -- Actionable queues. These are the numbers a staff member acts on today.
    'tickets_open',       (select count(*) from public.support_tickets
                            where status <> 'closed'),
    'moderation_pending', (select count(*) from public.moderation_queue
                            where status = 'pending'),

    -- From the owner-only table; counts only.
    'push_enabled', (select count(*) from public.profiles_private
                      where push_active is true),

    -- device_type is written ONLY by the mobile app, as part of its push
    -- registration. The web app never sets it, so someone on a phone browser
    -- can never be counted as iOS or Android. Rows with no value are members
    -- who have not installed the app, reported separately rather than mixed in
    -- as a third "unknown" device, which buried the split the client cares
    -- about.
    'app_users', (select count(*) from public.profiles_private
                   where nullif(trim(device_type), '') is not null),
    'devices', (
      select coalesce(json_object_agg(d, n), '{}'::json) from (
        select lower(trim(device_type)) as d, count(*) as n
        from public.profiles_private
        where nullif(trim(device_type), '') is not null
        group by 1
      ) x
    ),

    -- Twelve weeks of signups for the trend chart, oldest first.
    'signups_by_week', (
      select coalesce(json_agg(json_build_object('week', w, 'count', c) order by w), '[]'::json)
      from (
        select date_trunc('week', created_at)::date as w, count(*) as c
        from public.profiles
        where created_at > now() - interval '12 weeks'
        group by 1
      ) s
    ),
    'posts_by_week', (
      select coalesce(json_agg(json_build_object('week', w, 'count', c) order by w), '[]'::json)
      from (
        select date_trunc('week', created_at)::date as w, count(*) as c
        from public.posts
        where created_at > now() - interval '12 weeks'
        group by 1
      ) s
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;

comment on function public.admin_dashboard_stats() is
  'Admin dashboard aggregates. Staff-gated; returns counts only, never rows, so device and push figures can be surfaced without exposing profiles_private.';
