import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useAdminCounts } from '../../lib/useAdminCounts';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/members', label: 'Members', end: false },
  { to: '/admin/support', label: 'Support inbox', end: false, badge: 'tickets' as const },
  { to: '/admin/moderation', label: 'Moderation', end: false, badge: 'moderation' as const },
  { to: '/admin/features', label: 'Feature toggles', end: false },
  { to: '/admin/groups', label: 'Groups', end: false },
  { to: '/admin/branding', label: 'Branding', end: false },
  { to: '/admin/custom-fields', label: 'Custom fields', end: false },
  { to: '/admin/settings', label: 'Platform config', end: false },
];

export function AdminLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { data: counts } = useAdminCounts();
  return (
    <div className="min-h-screen bg-ground">
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6">
        <aside className="w-56 shrink-0">
          <Link to="/" className="mb-4 flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt=""
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="font-serif text-lg font-semibold text-heading">
              Laurie’s Love
            </span>
          </Link>
          <div className="mb-2 text-xs tracking-wide text-faint">
            Admin console
          </div>
          <nav className="space-y-1">
            {nav.map((n) => {
              const active = n.end
                ? pathname === n.to
                : pathname.startsWith(n.to);
              const count = n.badge ? (counts?.[n.badge] ?? 0) : 0;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                    active
                      ? 'bg-magenta text-white'
                      : 'text-body hover:bg-surface-2'
                  }`}
                >
                  <span>{n.label}</span>
                  {count > 0 && (
                    // Waiting work is shown where the moderator already is,
                    // rather than relying on them thinking to check.
                    <span
                      className={
                        'grid min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] font-semibold ' +
                        (active ? 'bg-white/25 text-white' : 'bg-magenta text-white')
                      }
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => signOut()}
            className="mt-6 text-sm text-muted hover:underline"
          >
            Sign out
          </button>
        </aside>
        <section className="flex-1 rounded-2xl bg-surface p-6 shadow-sm">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
