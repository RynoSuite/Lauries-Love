import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentOrgId } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { PageTitle } from '../../components/PageTitle';

// General platform config as JSON key/value pairs (org_settings). Owner-gated.
// Used for things like the sponsorship tiers the member app reads.
type Setting = { key: string; value: unknown };

async function fetchSettings(): Promise<Setting[]> {
  const { data, error } = await supabase
    .from('org_settings')
    .select('key, value')
    .order('key');
  if (error) throw error;
  return (data ?? []) as Setting[];
}

export function AdminPlatformConfig() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['org-settings'], queryFn: fetchSettings });

  const [newKey, setNewKey] = useState('');
  // Local edit buffers keyed by setting key (value serialized as JSON text).
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (v: { key: string; valueText: string }) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(v.valueText);
      } catch {
        throw new Error(`“${v.key}” is not valid JSON.`);
      }
      const orgId = await currentOrgId();
      if (!orgId) throw new Error('No org');
      const { error } = await supabase.from('org_settings').upsert(
        {
          org_id: orgId,
          key: v.key,
          value: parsed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,key' },
      );
      if (error) throw error;
    },
    onError: (e: Error) => setJsonError(e.message),
    onSuccess: (_r, v) => {
      setJsonError(null);
      setDrafts((d) => {
        const next = { ...d };
        delete next[v.key];
        return next;
      });
      qc.invalidateQueries({ queryKey: ['org-settings'] });
    },
  });

  const addKey = () => {
    const k = newKey.trim();
    if (!k) return;
    setDrafts((d) => ({ ...d, [k]: d[k] ?? '{}' }));
    setNewKey('');
  };

  if (!isAdmin)
    return (
      <p className="text-muted">Owner access is required to edit platform config.</p>
    );

  // Merge server rows with any draft-only (new) keys.
  const serverKeys = (data ?? []).map((s) => s.key);
  const draftOnlyKeys = Object.keys(drafts).filter((k) => !serverKeys.includes(k));
  const rows: { key: string; valueText: string }[] = [
    ...(data ?? []).map((s) => ({
      key: s.key,
      valueText: drafts[s.key] ?? JSON.stringify(s.value, null, 2),
    })),
    ...draftOnlyKeys.map((k) => ({ key: k, valueText: drafts[k] })),
  ];

  return (
    <div>
      <PageTitle>Platform config</PageTitle>
      <p className="mb-6 text-sm text-muted">
        Key/value settings stored as JSON. Read by the apps at runtime.
      </p>

      <div className="mb-6 flex gap-2">
        <input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="new_setting_key"
          className="w-64 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-magenta"
        />
        <button
          onClick={addKey}
          className="rounded-lg border border-magenta px-4 py-2 text-sm font-semibold text-heading hover:bg-surface-2"
        >
          Add key
        </button>
      </div>

      {jsonError && <p className="mb-3 text-sm text-danger">{jsonError}</p>}
      {isLoading && <p className="text-heading">Loading…</p>}

      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.key} className="rounded-2xl border border-line bg-surface p-4">
            <div className="mb-2 font-mono text-sm font-semibold text-heading">
              {row.key}
            </div>
            <textarea
              value={row.valueText}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [row.key]: e.target.value }))
              }
              rows={6}
              spellCheck={false}
              className="w-full rounded-lg border border-line p-3 font-mono text-xs outline-none focus:border-magenta"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={() => save.mutate({ key: row.key, valueText: row.valueText })}
                disabled={save.isPending}
                className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        ))}
        {!isLoading && rows.length === 0 && (
          <p className="text-muted">No settings yet. Add a key to get started.</p>
        )}
      </div>
    </div>
  );
}
