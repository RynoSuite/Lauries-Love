import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMyAvatar } from '../lib/useMyAvatar';
import { IconArrowRight } from './Icons';

// Nudges members who signed up on the web to finish their profile.
//
// Web signup only ever collected a name, email and password, so those members
// have no role, diagnosis, age or location: they do not appear usefully on the
// map and cannot be matched to groups. Mobile solves this by refusing entry
// until the profile is complete — and that gate is precisely what locked
// members out in August, when a single missing field bounced people back to
// onboarding forever.
//
// So this is a banner, not a wall. Dismissible, remembered per browser, and
// never shown on the onboarding page itself.
const DISMISS_KEY = 'll.completeProfileDismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function CompleteProfileBanner() {
  const { pathname } = useLocation();
  const { data: me, isLoading } = useMyAvatar();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (isLoading || dismissed) return null;
  if (pathname === '/welcome' || pathname === '/profile') return null;
  // No profile row yet, or a role already chosen: nothing to nudge about.
  if (!me || me.role_id) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-magenta/40 bg-magenta/10 px-4 py-3">
      <p className="min-w-0 flex-1 text-sm text-body">
        <span className="font-semibold text-heading">Finish your profile</span> so
        members on a similar road can find you. It takes a minute.
      </p>
      <Link
        to="/welcome"
        className="flex items-center gap-1.5 rounded-lg bg-magenta px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-magenta-hi"
      >
        Continue
        <IconArrowRight />
      </Link>
      <button
        onClick={() => {
          setDismissed(true);
          try {
            localStorage.setItem(DISMISS_KEY, '1');
          } catch {
            /* private window: it reappears next visit, which is acceptable */
          }
        }}
        className="text-sm text-muted hover:text-heading"
        aria-label="Dismiss"
      >
        Not now
      </button>
    </div>
  );
}
