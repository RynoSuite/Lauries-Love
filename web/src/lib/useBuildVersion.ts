import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Detects that a newer build has been deployed while this tab was open.
//
// A single-page app fetches its JavaScript once. After that, every route change
// is handled in memory, so a deploy is invisible to anyone with the tab already
// open — they keep running old code until they happen to hard-reload. Vite
// writes a fresh build id into the bundle and into /version.json, so comparing
// the two tells us whether this tab is stale.
declare const __BUILD_ID__: string;

const CHECK_URL = '/version.json';

async function fetchBuildId(): Promise<string | null> {
  try {
    // no-store, or the browser hands back the very file we are trying to
    // check for changes.
    const res = await fetch(CHECK_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as { build?: string };
    return json.build ?? null;
  } catch {
    // Offline, or the file is not deployed yet. Never surface this: a failed
    // version check is not something a member can act on.
    return null;
  }
}

export function useBuildVersion() {
  const { pathname } = useLocation();
  const [stale, setStale] = useState(false);
  // Navigating is the safe moment to swap builds: nothing is half-typed, and
  // the destination page renders with the new code rather than the old. So the
  // first navigation after a deploy reloads instead of prompting.
  const armed = useRef(false);

  useEffect(() => {
    if (armed.current) {
      // A newer build was seen before this navigation. Do it now. The router
      // has already pushed the new URL, so a plain reload lands on the page
      // that was being navigated to, query string and all.
      window.location.reload();
      return;
    }
    let cancelled = false;
    void fetchBuildId().then((id) => {
      if (cancelled || !id || id === __BUILD_ID__) return;
      armed.current = true;
      setStale(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Also check when the tab is brought back to the front, which is how someone
  // who left a page open overnight finds out.
  useEffect(() => {
    function onFocus() {
      void fetchBuildId().then((id) => {
        if (id && id !== __BUILD_ID__) {
          armed.current = true;
          setStale(true);
        }
      });
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return stale;
}
