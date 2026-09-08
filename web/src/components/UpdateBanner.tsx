import { useBuildVersion } from '../lib/useBuildVersion';

// Shown when the tab is running a build that is no longer the deployed one.
// Navigating anywhere reloads on its own; this is for someone sitting still on
// one page, who would otherwise never find out.
export function UpdateBanner() {
  const stale = useBuildVersion();
  if (!stale) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[1200] -translate-x-1/2">
      <button
        onClick={() => window.location.reload()}
        className="rounded-full border border-magenta bg-magenta px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-magenta-hi"
      >
        A new version is available — refresh
      </button>
    </div>
  );
}
