import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useConnections, connectionName } from '../lib/useConnections';
import { Avatar } from './Avatar';
import { ConfirmDialog } from './ConfirmDialog';

export type ThreadMember = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  avatar_path?: string | null;
};

function memberName(m: ThreadMember) {
  return m.display_name || m.first_name || 'Member';
}

// The bar above an open conversation.
//
// A direct thread never needed one: the person you are talking to is obvious.
// A group thread does. With five people in it you cannot tell who is here
// without being told, and there is no way to add anyone or get out.
export function ThreadHeader({
  conversationId,
  title,
  members,
  isGroup,
  isCommunityGroup,
  meId,
  onLeft,
}: {
  conversationId: string;
  title: string;
  members: ThreadMember[];
  isGroup: boolean;
  // A community group's own thread: membership follows the group, so it is not
  // editable here.
  isCommunityGroup: boolean;
  meId: string | null;
  onLeft: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(title);

  const editable = isGroup && !isCommunityGroup;
  const { data: connections } = useConnections(adding);
  const inThread = new Set(members.map((m) => m.id));
  const addable = (connections ?? []).filter((c) => !inThread.has(c.id));

  async function call(fn: string, args: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc(fn, args);
    setBusy(false);
    if (error) {
      setErr(
        /function|does not exist/i.test(error.message)
          ? 'Group messages need migration 20260908240000_group_messages_v1.sql on this project.'
          : error.message,
      );
      return false;
    }
    void qc.invalidateQueries({ queryKey: ['conversations'] });
    return true;
  }

  const others = members.filter((m) => m.id !== meId);

  return (
    <div className="border-b border-line px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {renaming ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Group name"
                className="min-w-0 flex-1 rounded-lg border border-line px-2 py-1 text-sm outline-none focus:border-magenta"
              />
              <button
                onClick={async () => {
                  if (await call('rename_conversation', {
                    p_conversation_id: conversationId,
                    p_name: nameDraft,
                  }))
                    setRenaming(false);
                }}
                disabled={busy}
                className="text-xs font-semibold text-magenta-text disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setRenaming(false);
                  setNameDraft(title);
                }}
                className="text-xs text-muted"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <div className="truncate text-sm font-semibold text-heading">{title}</div>
              {isGroup && (
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="text-xs text-faint hover:text-magenta-text"
                >
                  {members.length} member{members.length === 1 ? '' : 's'} ·{' '}
                  {open ? 'hide' : 'show'}
                </button>
              )}
            </>
          )}
        </div>

        {editable && !renaming && (
          <div className="flex shrink-0 gap-2 text-xs">
            <button
              onClick={() => setAdding((v) => !v)}
              className="rounded-lg border border-line px-2 py-1 text-body transition-colors hover:border-magenta hover:text-magenta-text"
            >
              {adding ? 'Cancel' : 'Add'}
            </button>
            <button
              onClick={() => setRenaming(true)}
              className="rounded-lg border border-line px-2 py-1 text-body transition-colors hover:border-magenta hover:text-magenta-text"
            >
              Rename
            </button>
            <button
              onClick={() => setLeaving(true)}
              className="rounded-lg border border-line px-2 py-1 text-body transition-colors hover:border-danger hover:text-danger"
            >
              Leave
            </button>
          </div>
        )}
      </div>

      {open && isGroup && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {others.map((m) => (
            <Link
              key={m.id}
              to={`/users/${m.id}`}
              className="flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 text-xs text-body transition-colors hover:border-magenta hover:text-magenta-text"
            >
              <Avatar path={m.avatar_path} name={memberName(m)} size={18} />
              {memberName(m)}
            </Link>
          ))}
        </div>
      )}

      {adding && editable && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-line p-2">
          {addable.length === 0 ? (
            <p className="text-xs text-faint">
              Everyone you are connected with is already in this conversation.
            </p>
          ) : (
            addable.map((c) => (
              <button
                key={c.id}
                disabled={busy}
                onClick={async () => {
                  if (
                    await call('add_conversation_member', {
                      p_conversation_id: conversationId,
                      p_profile_id: c.id,
                    })
                  )
                    setAdding(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-surface-2 disabled:opacity-50"
              >
                <Avatar path={c.avatar_path} name={connectionName(c)} size={20} />
                <span className="truncate">{connectionName(c)}</span>
              </button>
            ))
          )}
        </div>
      )}

      {err && <p className="mt-2 text-xs text-danger">{err}</p>}

      <ConfirmDialog
        open={leaving}
        title="Leave this conversation?"
        body="You will stop receiving messages from it and it will disappear from your list. The conversation carries on without you, and what you have already said stays where it is."
        confirmLabel="Leave"
        destructive
        busy={busy}
        onConfirm={async () => {
          if (await call('leave_conversation', { p_conversation_id: conversationId })) {
            setLeaving(false);
            onLeft();
          }
        }}
        onCancel={() => setLeaving(false)}
      />
    </div>
  );
}
