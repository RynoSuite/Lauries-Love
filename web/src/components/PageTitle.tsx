import type { ReactNode } from 'react';
import { IconHeart } from './Icons';

// The page heading: Sea Mist type over a magenta rule, with the heart sitting
// at the end of the rule — the treatment from the approved UI comp.
//
// Kept as one component rather than inlined per page so every module's title
// stays identical; a page that wants a different heading is a design decision,
// not something that should drift in by copy-paste.
export function PageTitle({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-semibold text-heading">
          {children}
        </h1>
        {actions}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="block h-[3px] w-24 rounded-full bg-magenta" />
        <IconHeart className="h-3.5 w-3.5 text-magenta-text" />
      </div>
    </div>
  );
}
