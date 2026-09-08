import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PageTitle } from '../../components/PageTitle';
import {
  IconBell,
  IconBook,
  IconComment,
  IconCommunity,
  IconFlag,
  IconGroups,
  IconHeart,
  IconMessages,
  IconProfile,
  IconSupport,
} from '../../components/Icons';

// Admin overview.
//
// Everything here is derived from Postgres. The previous version advertised
// DAU / MAU / D7 retention / average session as permanently blank tiles
// awaiting an analytics integration, which is worse than not showing them: it
// reads as a broken dashboard rather than a deliberate gap. Those need real
// event tracking and are not faked; what replaces them are figures the
// database can actually answer.

// The two platforms the app ships on. Always rendered, even at zero.
const PLATFORMS = [
  { key: 'ios', label: 'iOS' },
  { key: 'android', label: 'Android' },
] as const;

type Week = { week: string; count: number };
type Stats = {
  members_total: number;
  members_active_flag: number;
  members_new_30d: number;
  members_new_7d: number;
  engaged_30d: number;
  engaged_7d: number;
  posts_total: number;
  posts_7d: number;
  comments_total: number;
  groups_total: number;
  conversations_total: number;
  messages_7d: number;
  tickets_open: number;
  moderation_pending: number;
  push_enabled: number;
  app_users: number;
  devices: Record<string, number>;
  signups_by_week: Week[];
  posts_by_week: Week[];
};

async function fetchStats(): Promise<Stats | null> {
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;
  return (data as Stats) ?? null;
}

function Tile({
  label,
  value,
  sub,
  Icon,
  to,
  urgent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  Icon: (p: { className?: string }) => JSX.Element;
  to?: string;
  urgent?: boolean;
}) {
  const body = (
    <div
      className={
        'flex h-full items-start gap-3 rounded-xl border p-4 transition-colors ' +
        (urgent
          ? 'border-warn/40 bg-warn/10'
          : 'border-line bg-surface-2') +
        (to ? ' hover:border-magenta' : '')
      }
    >
      <span
        className={
          'grid h-9 w-9 shrink-0 place-items-center rounded-full ' +
          (urgent ? 'bg-warn/20 text-warn' : 'bg-magenta-plate text-magenta-text')
        }
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight text-heading">{value}</div>
        <div className="text-sm text-body">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-faint">{sub}</div>}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

// Weekly counts as bars: discrete buckets, one series, so the title carries the
// identity and no legend is needed. Marks are thin with rounded tops anchored
// to the baseline, a 2px gap between them, and a recessive baseline; the axis
// is labelled at the ends rather than on every bar.
function WeeklyBars({
  title,
  data,
  emptyNote,
}: {
  title: string;
  data: Week[];
  emptyNote: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const H = 120;

  if (!data.length) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-sans text-sm font-semibold text-magenta-text">{title}</h2>
        <p className="mt-2 text-sm text-muted">{emptyNote}</p>
      </section>
    );
  }

  const fmt = (w: string) =>
    new Date(w).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-sm font-semibold text-magenta-text">{title}</h2>
        <span className="text-xs text-faint">last 12 weeks</span>
      </div>

      <div className="relative mt-4" style={{ height: H }}>
        <div className="flex h-full items-end gap-[2px]">
          {data.map((d, i) => (
            <div
              key={d.week}
              className="relative flex-1"
              style={{ height: '100%' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={
                  'absolute bottom-0 w-full rounded-t transition-colors ' +
                  (hover === i ? 'bg-magenta-text' : 'bg-magenta')
                }
                style={{ height: `${Math.max(2, (d.count / max) * H)}px` }}
              />
              {hover === i && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs text-heading shadow-lg">
                  <span className="font-semibold">{d.count}</span>{' '}
                  <span className="text-faint">week of {fmt(d.week)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex justify-between border-t border-line pt-1.5 text-[11px] text-faint">
        <span>{fmt(data[0].week)}</span>
        <span>peak {max}</span>
        <span>{fmt(data[data.length - 1].week)}</span>
      </div>
    </section>
  );
}

export function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchStats,
  });

  if (isLoading) return <p className="text-heading">Loading…</p>;

  if (error) {
    const msg = (error as Error).message ?? '';
    const missing = /admin_dashboard_stats|function/i.test(msg);
    return (
      <div>
        <PageTitle>Dashboard</PageTitle>
        <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {missing
            ? 'The dashboard statistics function is not installed on this project. Run supabase/migrations/20260908140000_admin_dashboard_stats_v1.sql, then reload.'
            : msg}
        </p>
      </div>
    );
  }

  const s = data;
  if (!s) return <p className="text-muted">No data.</p>;

  const deviceCounts = s.devices ?? {};
  const appUsers = s.app_users ?? 0;
  // Anything the app reported that is not ios/android, so an unexpected value
  // is visible rather than silently dropped.
  const otherDevices = Object.entries(deviceCounts).filter(
    ([k]) => !PLATFORMS.some((p) => p.key === k),
  );
  const pushPct = s.members_total
    ? Math.round((s.push_enabled / s.members_total) * 100)
    : 0;

  return (
    <div className="pb-10">
      <PageTitle>Dashboard</PageTitle>

      {/* Anything needing action comes first. */}
      {(s.tickets_open > 0 || s.moderation_pending > 0) && (
        <>
          <h2 className="mb-2 font-sans text-sm font-semibold text-magenta-text">
            Needs attention
          </h2>
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <Tile
              label="Open support tickets"
              value={s.tickets_open}
              Icon={IconSupport}
              to="/admin/support"
              urgent={s.tickets_open > 0}
            />
            <Tile
              label="Reports awaiting review"
              value={s.moderation_pending}
              Icon={IconFlag}
              to="/admin/moderation"
              urgent={s.moderation_pending > 0}
            />
          </div>
        </>
      )}

      <h2 className="mb-2 font-sans text-sm font-semibold text-magenta-text">
        Community
      </h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Members"
          value={s.members_total}
          sub={`${s.members_new_30d} joined in the last 30 days`}
          Icon={IconProfile}
          to="/admin/members"
        />
        <Tile
          label="Posting or commenting"
          value={s.engaged_30d}
          sub="in the last 30 days"
          Icon={IconCommunity}
        />
        <Tile
          label="Groups"
          value={s.groups_total}
          Icon={IconGroups}
          to="/admin/groups"
        />
        <Tile
          label="Conversations"
          value={s.conversations_total}
          sub={`${s.messages_7d} messages this week`}
          Icon={IconMessages}
        />
      </div>

      <h2 className="mb-2 font-sans text-sm font-semibold text-magenta-text">
        Content
      </h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Posts"
          value={s.posts_total}
          sub={`${s.posts_7d} this week`}
          Icon={IconBook}
        />
        <Tile label="Comments" value={s.comments_total} Icon={IconComment} />
        <Tile
          label="Push notifications on"
          value={`${pushPct}%`}
          sub={`${s.push_enabled} of ${s.members_total} members`}
          Icon={IconBell}
        />
        <Tile
          label="New this week"
          value={s.members_new_7d}
          sub="members"
          Icon={IconHeart}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <WeeklyBars
          title="New members per week"
          data={s.signups_by_week ?? []}
          emptyNote="No signups in the last 12 weeks."
        />
        <WeeklyBars
          title="Posts per week"
          data={s.posts_by_week ?? []}
          emptyNote="No posts in the last 12 weeks."
        />
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="font-sans text-sm font-semibold text-magenta-text">
          Mobile app
        </h2>
        <p className="mb-3 text-xs text-faint">
          Recorded when a member signs in on the iOS or Android app. Using the
          site in a phone browser is not counted.
        </p>

        {appUsers === 0 ? (
          <p className="text-sm text-muted">
            No one has signed in on the mobile app yet.
          </p>
        ) : (
          <div className="space-y-2">
            {/* iOS and Android are always shown, at zero if need be. A platform
                missing from the chart reads as a data problem; a platform at
                zero is an answer. */}
            {PLATFORMS.map(({ key, label }) => {
              const n = deviceCounts[key] ?? 0;
              const pct = appUsers ? Math.round((n / appUsers) * 100) : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-sm text-body">{label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-magenta"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-sm text-muted">
                    {n} ({pct}%)
                  </span>
                </div>
              );
            })}
            {otherDevices.map(([name, n]) => {
              const pct = appUsers ? Math.round((n / appUsers) * 100) : 0;
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 truncate text-sm capitalize text-body">
                    {name}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-magenta/50"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-sm text-muted">
                    {n} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 border-t border-line pt-3 text-xs text-faint">
          {appUsers} of {s.members_total} members have used the app.{' '}
          {s.members_total - appUsers} have only used the website.
        </p>
      </section>

      <p className="mt-6 text-xs leading-relaxed text-faint">
        Engagement counts members who posted or commented, so it undercounts
        people who only read. Session length and retention need event tracking
        and are deliberately not shown rather than estimated.
      </p>
    </div>
  );
}
