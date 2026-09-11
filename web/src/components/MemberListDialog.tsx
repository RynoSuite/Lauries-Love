import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from './Avatar';

export type DialogMember = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name?: string | null;
  avatar_path: string | null;
};

/**
 * Everyone in a group, in a scrollable dialog.
 *
 * The roster used to expand in place: tapping "+12 more" pushed the group's
 * own posts down the page by however many members it had, and a group with
 * three hundred people buried the group under a wall of faces. A dialog holds
 * a long list without moving anything behind it, and scrolls rather than
 * growing.
 *
 * Faces alone are enough in the strip on the page — you are scanning for
 * someone you recognise. Here you are reading a list, so each row carries the
 * name as well.
 */
export function MemberListDialog({
  open,
  members,
  loading,
  total,
  onClose,
}: {
  open: boolean;
  members: DialogMember[];
  loading: boolean;
  total: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const nameOf = (m: DialogMember) =>
    [m.first_name, m.last_name].filter(Boolean).join(' ') ||
    m.display_name ||
    'Member';

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="members-title"
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="members-title" className="font-serif text-lg text-heading">
            Members{' '}
            <span className="font-sans text-sm text-faint">({total})</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-sm text-muted transition-colors hover:text-heading"
          >
            Close
          </button>
        </div>

        {/* The only part that scrolls, so the heading and the close control
            stay reachable however long the list is. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <p className="px-3 py-6 text-sm text-faint">Loading members…</p>
          ) : members.length === 0 ? (
            <p className="px-3 py-6 text-sm text-faint">No members yet.</p>
          ) : (
            members.map((m) => {
              const name = nameOf(m);
              return (
                <Link
                  key={m.id}
                  to={`/users/${m.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-surface-2"
                >
                  <Avatar path={m.avatar_path} name={name} size={36} />
                  <span className="min-w-0 truncate text-sm font-medium text-heading">
                    {name}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
