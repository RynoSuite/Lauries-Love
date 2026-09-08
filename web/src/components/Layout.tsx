import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useBranding } from '../lib/branding';
import { UserMenu } from './UserMenu';
import {
  IconArrowRight,
  IconBell,
  IconBook,
  IconCommunity,
  IconGroups,
  IconHeart,
  IconMap,
  IconMessages,
  IconRibbon,
} from './Icons';

// App shell — Laurie's Love.
//
// Palette source: https://branding.skyway.media/ll/ ("Plume, refined").
// Colour ROLES follow the approved UI comp, which the client signed off over
// the guide's "one vivid stroke" note: magenta leads the interface.
//   · Ink is the ground; Harbor/surface own the cards.
//   · Magenta is the interface colour — active nav, links, buttons, module
//     titles, icons. It has two stops, and the split matters:
//       bg-magenta  (#911766) for FILLS   — white on it scores 8.34:1
//       text-magenta-text (#F45FAF) for TYPE — 5.14:1 on cards, passes AA
//     Using #911766 as type would score 1.82:1, i.e. unreadable.
//   · Borders are a faint white veil, not a teal line.
//   · Gilt survives only in the logo mark itself — a metal, never a fill.
// Sentence case throughout; no uppercase anywhere in the system.

// Six real destinations. Profile, Support, Admin and Sign out are account
// actions, not places, so they live in the UserMenu chip instead.
// `iconOnly` entries never show their label — the glyph carries the meaning,
// so the label survives only as the accessible name.
const NAV = [
  { to: '/', label: 'Community', Icon: IconCommunity, end: true, iconOnly: false },
  { to: '/groups', label: 'Groups', Icon: IconGroups, iconOnly: false },
  { to: '/messages', label: 'Messages', Icon: IconMessages, iconOnly: false },
  { to: '/map', label: 'Map', Icon: IconMap, iconOnly: false },
  { to: '/donate', label: 'Donate', Icon: IconHeart, iconOnly: false },
  { to: '/notifications', label: 'Notifications', Icon: IconBell, iconOnly: true },
];

// The left rail repeats the primary destinations at a comfortable reading
// size. Only routes that actually exist appear here — no placeholder links.
const RAIL = [
  { to: '/', label: 'Community feed', Icon: IconCommunity, end: true },
  { to: '/groups', label: 'My groups', Icon: IconGroups },
  { to: '/messages', label: 'Messages', Icon: IconMessages },
  { to: '/map', label: 'Member map', Icon: IconMap },
  { to: '/sponsors', label: 'Sponsors', Icon: IconBook },
];

// Active nav is magenta type over a magenta underline, matching the comp.
const navClass = (isActive: boolean) =>
  'flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 pb-2.5 pt-2 text-sm transition-colors ' +
  (isActive
    ? 'border-magenta text-magenta-text'
    : 'border-transparent text-body hover:text-heading');

const railClass = (isActive: boolean) =>
  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ' +
  (isActive
    ? 'bg-magenta/15 font-semibold text-magenta-text'
    : 'text-body hover:bg-surface-2 hover:text-heading');

// Pages whose content wants the width: grids of group cards, the two-pane
// message view, and the map canvas. The right rail is contextual reading
// material, so on these it costs more than it adds.
const WIDE_ROUTES = ['/groups', '/messages', '/map'];

export function Layout() {
  const { appName, logoUrl } = useBranding();
  const { pathname } = useLocation();
  const wide = WIDE_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/'),
  );

  return (
    <div className="min-h-screen bg-ground">
      <header className="sticky top-0 z-20 bg-harbor/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-6 px-4 py-2 sm:px-6">
          {/* Mark only. The wordmark and tagline are carried by the logo's own
              lockup elsewhere; repeating them here crowded the bar. appName
              stays as the accessible name so the link is still announced. */}
          <Link to="/" className="flex shrink-0 items-center" aria-label={appName}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 object-contain"
              />
            ) : (
              <IconRibbon className="h-10 w-10 text-magenta-text" />
            )}
          </Link>

          <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
            {NAV.map(({ to, label, Icon, end, iconOnly }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={iconOnly ? label : undefined}
                title={iconOnly ? label : undefined}
                className={({ isActive }) => navClass(isActive)}
              >
                <Icon className={iconOnly ? 'h-[22px] w-[22px]' : undefined} />
                {!iconOnly && <span className="hidden lg:inline">{label}</span>}
              </NavLink>
            ))}
          </nav>

          <UserMenu />
        </div>
        <hr className="border-0 border-b border-line" />
      </header>

      <div
        className={
          'mx-auto grid max-w-[1500px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[248px_minmax(0,1fr)] ' +
          (wide ? '' : 'xl:grid-cols-[248px_minmax(0,1fr)_296px]')
        }
      >
        {/* Left rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-[92px] space-y-4">
            <section className="overflow-hidden rounded-2xl border border-line bg-surface">
              <img
                src="/you-matter.png"
                alt=""
                className="h-32 w-full object-cover"
              />
              <div className="px-4 pb-4 pt-3 text-center">
                <h2 className="font-serif text-lg leading-tight text-magenta-text">
                  Connect. Empower. Inspire.
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  A safe space to share, connect, and support one another on the
                  cancer journey.
                </p>
                <IconHeart className="mx-auto mt-2 h-5 w-5 text-magenta-text" />
              </div>
            </section>

            <nav className="space-y-1 rounded-2xl border border-line bg-surface p-2">
              {RAIL.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => railClass(isActive)}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <section className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-magenta-plate text-magenta-text">
                  <IconRibbon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="font-sans text-sm font-semibold text-magenta-text">
                  Need support now?
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                You are not alone. Reach the team any time.
              </p>
              <Link
                to="/support"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-heading transition-colors hover:border-magenta hover:text-magenta-text"
              >
                Contact support
              </Link>
            </section>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>

        {/* Right rail */}
        <aside className={wide ? 'hidden' : 'hidden xl:block'}>
          <div className="sticky top-[92px] space-y-4">
            <RailCard
              Icon={IconHeart}
              title="Community guidelines"
              body="Be kind. Be respectful. Be supportive. Together we keep this a safe space for everyone."
            />
            {/* "Support resources" removed: it duplicated the support card in
                the left rail, so the same destination appeared twice on one
                screen. The left one is kept because it sits above the fold. */}
            <RailCard
              Icon={IconCommunity}
              title="Active groups"
              body="Connect in groups that match what you are actually facing."
              to="/groups"
              cta="Browse groups"
            />

            {/* The artwork ships without type on it, so the line is set here.
                The heart sits in the lower-right of the square source, so the
                crop is pulled down to 62% to keep the heart and its swoosh in
                the band, and the copy is inset left of it. */}
            <section className="relative overflow-hidden rounded-2xl border border-line">
              <img
                src="/stronger.png"
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: '50% 62%' }}
              />
              <p className="relative py-9 pl-5 pr-24 font-serif text-lg leading-snug text-heading">
                Together, we are stronger.
              </p>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RailCard({
  Icon,
  title,
  body,
  to,
  cta,
}: {
  Icon: (p: { className?: string }) => ReactElement;
  title: string;
  body: string;
  to?: string;
  cta?: string;
}) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-magenta-plate text-magenta-text">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="font-sans text-sm font-semibold text-magenta-text">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
          {to && cta && (
            <Link
              to={to}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-magenta-text hover:underline"
            >
              {cta}
              <IconArrowRight />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
