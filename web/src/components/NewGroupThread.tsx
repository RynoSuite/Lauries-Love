import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useConnections, connectionName } from '../lib/useConnections';
import { Avatar } from './Avatar';

// Composer for a new group thread.
//
// Only accepted connections can be picked. That is the client's rule and it is
// also the safety rule: in a cancer-support community, being added to a group
// conversation by a stranger is not a neutral event.
export function NewGroupThread({
  onCreated,
  onCancel,
}: {
  onCreated: (conversationId: string) => void;
  onCancel: () => void;
}) {
  const { data: connections, isLoading } = useConnections();
  const [name, setName] = useState('');
  const [filter, setFilter] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const q = filter.trim().toLowerCase();
  const visible = (connections ?? []).filter(
    (c) => !q || connectionName(c).toLowerCase().includes(q),
  );

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function create() {
    setBusy(true);
    setErr(null);
    const { data, error } = await supabase.rpc('create_group_conversation', {
      p_name: name.trim() || null,
      p_member_ids: [...picked],
    });
    setBusy(false);
    if (error || !data) {
      setErr(
        /function|does not exist/i.test(error?.message ?? '')
          ? 'Group messages need migration 20260908240000_group_messages_v1.sql on this project.'
          : (error?.message ?? 'Could not create the group.'),
      );
      return;
    }
    onCreated(data as string);
  }

  return (
    <div className="border-b border-line p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group name (optional)"
        className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-magenta"
      />

      {isLoading ? (
        <p className="mt-2 text-xs text-faint">Loading your connections…</p>
      ) : (connections ?? []).length === 0 ? (
        // Not an error state. A new member simply has nobody to add yet, and
        // saying so is more use than an empty list.
        <p className="mt-2 text-xs text-faint">
          You can start a group once you have connections. Add friends from a
          member&rsquo;s profile or the map.
        </p>
      ) : (
        <>
          {(connections ?? []).length > 6 && (
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Find a connection…"
              className="mt-2 w-full rounded-lg border border-line px-3 py-1.5 text-sm outline-none focus:border-magenta"
            />
          )}
          <div className="mt-2 max-h-48 space-y-0.5 overflow-y-auto">
            {visible.map((c) => (
              <label
                key={c.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-surface-2"
              >
                <input
                  type="checkbox"
                  checked={picked.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="accent-magenta"
                />
                <Avatar path={c.avatar_path} name={connectionName(c)} size={22} />
                <span className="truncate text-sm">{connectionName(c)}</span>
              </label>
            ))}
            {visible.length === 0 && (
              <p className="px-2 text-xs text-faint">No connections match that.</p>
            )}
          </div>
        </>
      )}

      {err && <p className="mt-2 text-xs text-danger">{err}</p>}

      {/* The hint gets its own line. Inline beside the buttons it collided
          with Cancel in the 16rem rail. */}
      {(connections ?? []).length === 1 ? (
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          A group needs three people: you and two others. You have one
          connection so far, so use the Direct tab for now.
        </p>
      ) : (
        picked.size < 2 && (
          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            Pick {picked.size === 1 ? 'one more person' : 'two people'} to make
            a group of three. For one, use the Direct tab instead.
          </p>
        )
      )}

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={create}
          // Two others minimum. With one, a group thread would duplicate the
          // direct message with that person: direct threads are unique by
          // direct_key, group threads are not, so both would sit in the list
          // accepting messages and a reply could land in the one nobody reads.
          disabled={busy || picked.size < 2}
          className="rounded-lg bg-magenta px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-magenta-hi disabled:opacity-50"
        >
          {busy ? 'Creating…' : `Create group (${picked.size})`}
        </button>
        <button onClick={onCancel} className="text-xs text-muted hover:text-heading">
          Cancel
        </button>
      </div>
    </div>
  );
}
