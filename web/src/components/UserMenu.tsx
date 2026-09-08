import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useMyAvatar } from '../lib/useMyAvatar';
import { useAdminCounts } from '../lib/useAdminCounts';
import { Avatar } from './Avatar';
import { IconAdmin, IconProfile, IconSignOut, IconSupport } from './Icons';

// The account chip in the header. Profile, Support, Admin and Sign out used to
// sit in the top nav; they are personal/account actions rather than places in
// the community, so they collapse into this menu and leave the nav to the six
// real destinations.
//
// Closes on outside click and on Escape, and the trigger carries the ARIA
// wiring so it behaves for keyboard and screen-reader users too.
export function UserMenu() {
  const { session, isStaff, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Prefer the profiles row — it carries the avatar and is what the member
  // actually edits. auth metadata is the fallback for a session whose profile
  // row has not loaded yet.
  const { data: me } = useMyAvatar();
  // Reports and tickets waiting, so staff notice from the member side too.
  const { data: adminCounts } = useAdminCounts();
  const adminWaiting = (adminCounts?.moderation ?? 0) + (adminCounts?.tickets ?? 0);
  const meta = session?.user?.user_metadata as
    | { display_name?: string; first_name?: string }
    | undefined;
  const email = session?.user?.email ?? '';
  const name =
    me?.display_name ||
    me?.first_name ||
    meta?.display_name ||
    meta?.first_name ||
    email.split('@')[0] ||
    'Member';

  const itemClass =
    'flex items-center gap-2.5 px-3 py-2.5 text-sm text-body transition-colors hover:bg-surface-2 hover:text-heading';

  return (
    <div className="relative shrink-0" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        className={
          'rounded-full transition-shadow ' +
          (open ? 'ring-2 ring-magenta-text ring-offset-2 ring-offset-harbor' : '')
        }
      >
        <Avatar path={me?.avatar_path} name={name} size={36} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-xl"
        >
          <div className="border-b border-line px-3 py-3">
            <div className="truncate text-sm font-semibold text-heading">{name}</div>
            {email && <div className="truncate text-xs text-faint">{email}</div>}
          </div>

          <Link to="/profile" className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
            <IconProfile className="h-[18px] w-[18px] shrink-0 text-magenta-text" />
            Profile
          </Link>
          <Link to="/support" className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
            <IconSupport className="h-[18px] w-[18px] shrink-0 text-magenta-text" />
            Support
          </Link>
          {isStaff && (
            <Link to="/admin" className={itemClass} role="menuitem" onClick={() => setOpen(false)}>
              <IconAdmin className="h-[18px] w-[18px] shrink-0 text-magenta-text" />
              Admin console
              {adminWaiting > 0 && (
                <span className="ml-auto grid min-w-[20px] place-items-center rounded-full bg-magenta px-1.5 text-[11px] font-semibold text-white">
                  {adminWaiting > 99 ? '99+' : adminWaiting}
                </span>
              )}
            </Link>
          )}

          <button
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            role="menuitem"
            className={itemClass + ' w-full border-t border-line text-left'}
          >
            <IconSignOut className="h-[18px] w-[18px] shrink-0 text-magenta-text" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
