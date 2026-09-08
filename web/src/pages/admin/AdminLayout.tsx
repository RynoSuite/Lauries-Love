import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/members', label: 'Members', end: false },
  { to: '/admin/support', label: 'Support inbox', end: false },
  { to: '/admin/moderation', label: 'Moderation', end: false },
  { to: '/admin/features', label: 'Feature toggles', end: false },
  { to: '/admin/groups', label: 'Groups', end: false },
  { to: '/admin/branding', label: 'Branding', end: false },
  { to: '/admin/custom-fields', label: 'Custom fields', end: false },
  { to: '/admin/settings', label: 'Platform config', end: false },
];

export function AdminLayout() {
  const { pathname } = useLocation();
  const { signOut } = useAuth();
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
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    active
                      ? 'bg-magenta text-white'
                      : 'text-body hover:bg-surface-2'
                  }`}
                >
                  {n.label}
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
