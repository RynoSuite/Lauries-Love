import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { PageTitle } from '../../components/PageTitle';
import { ConfirmDialog } from '../../components/ConfirmDialog';

// Admin group management. Reads/writes the shared groups table. Writes are
// owner-gated at the DB (groups_owner_* policies) and in the UI.
type Group = {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  cover_path: string | null;
  /** How many posts go with it, so the confirm can say the real number. */
  postCount: number;
};

type GroupForm = {
  id: string | null;
  name: string;
  description: string;
  tags: string;
  cover_path: string;
};

const EMPTY: GroupForm = { id: null, name: '', description: '', tags: '', cover_path: '' };

async function fetchGroups(): Promise<Group[]> {
  // The post count comes back with the row: deleting a group now deletes its
  // posts, and an admin should be told how many before confirming, not after.
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, description, tags, cover_path, posts(count)')
    .order('name');
  if (error) throw error;
  return ((data ?? []) as any[]).map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    tags: g.tags,
    cover_path: g.cover_path,
    postCount: g.posts?.[0]?.count ?? 0,
  }));
}

function parseTags(s: string): string[] {
  return s
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

// Covers upload to the public 'avatars' bucket under the uploader's uid prefix
// (owner-write policy requires foldername[1] === auth.uid()), same convention
// as create_group's p_cover_path.
function coverUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
}

export function AdminGroups() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<GroupForm>(EMPTY);
  const { data, isLoading } = useQuery({ queryKey: ['admin-groups'], queryFn: fetchGroups });

  const [pendingDelete, setPendingDelete] = useState<Group | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleCoverFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${me}/group-covers/${Date.now()}.${ext}`;
      // NOT upsert. Upsert makes storage issue INSERT ... ON CONFLICT DO
      // UPDATE, which is also checked against the bucket's UPDATE policy —
      // and avatars_owner_update has a USING clause but no WITH CHECK, so the
      // write is refused with "new row violates row-level security policy".
      // The path carries Date.now(), so it cannot collide and upsert bought
      // nothing. (AvatarUpload already passes upsert:false, which is why
      // member photos worked while group covers did not.)
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (error) throw error;
      setForm((prev) => ({ ...prev, cover_path: path }));
    } catch (err) {
      // Was `catch {}` with a generic "try again", which hid the only useful
      // information. The upload path and storage policy are both fine when
      // tested directly, so whatever fails here is worth reading.
      setUploadError(
        err instanceof Error ? err.message : 'Upload failed for an unknown reason.',
      );
    } finally {
      setUploading(false);
    }
  }

  const upsert = useMutation({
    mutationFn: async (f: GroupForm) => {
      const payload = {
        name: f.name.trim(),
        description: f.description.trim() || null,
        tags: parseTags(f.tags),
        cover_path: f.cover_path.trim() || null,
      };
      if (f.id) {
        const { error } = await supabase.from('groups').update(payload).eq('id', f.id);
        if (error) throw error;
      } else {
        const me = await currentUserId();
        const { error } = await supabase
          .from('groups')
          .insert({ ...payload, created_by: me });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ['admin-groups'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-groups'] }),
  });

  if (!isAdmin)
    return (
      <p className="text-muted">Owner access is required to manage groups.</p>
    );

  return (
    <div>
      <PageTitle>Groups</PageTitle>
      <p className="mb-6 text-sm text-muted">
        Create and manage community groups. Tags drive the recommendation
        matching on mobile.
      </p>

      {/* Editor */}
      <div className="mb-6 rounded-2xl border border-line bg-surface-2 p-4">
        <div className="mb-3 text-sm font-semibold text-heading">
          {form.id ? 'Edit group' : 'New group'}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Group name"
            className="rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta"
          />
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (comma separated)"
            className="rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          rows={2}
          className="mt-3 w-full resize-none rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta"
        />

        <div className="mt-3">
          <span className="mb-1 block text-sm text-muted">Cover image</span>
          <div className="flex items-center gap-3">
            {coverUrl(form.cover_path) && (
              <img
                src={coverUrl(form.cover_path) ?? undefined}
                alt=""
                className="h-14 w-24 rounded-lg object-cover"
              />
            )}
            <label className="cursor-pointer rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-heading hover:border-magenta">
              {uploading ? 'Uploading…' : form.cover_path ? 'Replace image' : 'Upload image'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverFile(file);
                  e.target.value = '';
                }}
              />
            </label>
            {form.cover_path && (
              <button
                type="button"
                onClick={() => setForm({ ...form, cover_path: '' })}
                className="text-sm text-muted hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          {uploadError && (
            <p className="mt-1 text-sm text-danger">Could not upload: {uploadError}</p>
          )}
        </div>

        {upsert.isError && (
          <p className="mt-2 text-sm text-danger">Couldn’t save, try again.</p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => upsert.mutate(form)}
            disabled={!form.name.trim() || upsert.isPending}
            className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
          >
            {form.id ? 'Save changes' : 'Create group'}
          </button>
          {form.id && (
            <button
              onClick={() => setForm(EMPTY)}
              className="rounded-lg px-4 py-2 text-sm text-muted hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {isLoading && <p className="text-heading">Loading…</p>}
      <ul className="divide-y divide-line">
        {(data ?? []).map((g) => (
          <li key={g.id} className="flex items-start justify-between gap-4 py-3">
            <div className="flex items-start gap-3">
              {coverUrl(g.cover_path) && (
                <img
                  src={coverUrl(g.cover_path) ?? undefined}
                  alt=""
                  className="mt-0.5 h-12 w-20 shrink-0 rounded-lg object-cover"
                />
              )}
              <div>
              <div className="font-medium">{g.name}</div>
              {g.description && (
                <div className="text-sm text-muted">{g.description}</div>
              )}
              {g.tags && g.tags.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {g.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-heading"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              </div>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              <button
                onClick={() =>
                  setForm({
                    id: g.id,
                    name: g.name,
                    description: g.description ?? '',
                    tags: (g.tags ?? []).join(', '),
                    cover_path: g.cover_path ?? '',
                  })
                }
                className="text-heading hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => setPendingDelete(g)}
                className="text-danger hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name ?? ''}"?`}
        body={
          pendingDelete && pendingDelete.postCount > 0
            ? `This also deletes the ${pendingDelete.postCount} post${
                pendingDelete.postCount === 1 ? '' : 's'
              } shared to this group, along with their comments and likes. Members keep their other posts. This cannot be undone.`
            : 'This group has no posts. This cannot be undone.'
        }
        confirmLabel="Delete group"
        destructive
        busy={remove.isPending}
        onConfirm={() => {
          if (pendingDelete) remove.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
