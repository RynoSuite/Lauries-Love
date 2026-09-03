import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentOrgId } from '../../lib/supabase';
import { PageTitle } from '../../components/PageTitle';

// Feature-toggle admin UI. Explicitly enumerates the 9 SOW platform modules so
// the console always shows the full set (and can turn each on/off) regardless of
// what rows currently exist. Toggling upserts the platform_features row. Every
// surface (iOS/Android/Web) gates its modules on these rows — the foundation for
// licensing the platform to other orgs.
const MODULES: { key: string; label: string }[] = [
  { key: 'community_map', label: 'Community Map' },
  { key: 'donations', label: 'Donations' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'community_wall', label: 'Community Wall' },
  { key: 'groups', label: 'Groups' },
  { key: 'sponsorships', label: 'Sponsorships' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'ai_moderation', label: 'AI Moderation' },
  { key: 'support_center', label: 'Support Center' },
];

async function fetchEnabledMap(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('platform_features')
    .select('feature_key, enabled');
  if (error) throw error;
  const map: Record<string, boolean> = {};
  (data ?? []).forEach((r: { feature_key: string; enabled: boolean }) => {
    map[r.feature_key] = r.enabled;
  });
  return map;
}

export function AdminFeatures() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['features'],
    queryFn: fetchEnabledMap,
  });

  const toggle = useMutation({
    mutationFn: async (v: { key: string; label: string; enabled: boolean }) => {
      const orgId = await currentOrgId();
      if (!orgId) throw new Error('No org');
      const { error } = await supabase.from('platform_features').upsert(
        {
          org_id: orgId,
          feature_key: v.key,
          label: v.label,
          enabled: !v.enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,feature_key' },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['features'] }),
  });

  const enabledMap = data ?? {};

  return (
    <div>
      <PageTitle>Feature toggles</PageTitle>
      <p className="mb-6 text-sm text-muted">
        Turn platform modules on or off. Changes apply across mobile and web.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-surface-2 p-4 text-sm text-warn">
          Couldn’t read <code>platform_features</code>. Toggles below still write
          (they upsert), but the current state may be stale until the table is
          reachable.
        </div>
      )}

      {isLoading && <p className="text-heading">Loading…</p>}

      <ul className="divide-y divide-line">
        {MODULES.map((m) => {
          // Default ON when a row is absent (matches the app's fail-open flag).
          const enabled = enabledMap[m.key] ?? true;
          return (
            <li key={m.key} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{m.label}</div>
                <div className="text-xs text-faint">{m.key}</div>
              </div>
              <button
                onClick={() => toggle.mutate({ key: m.key, label: m.label, enabled })}
                disabled={toggle.isPending}
                className={`relative h-6 w-11 rounded-full transition ${
                  enabled ? 'bg-magenta' : 'bg-surface-2'
                }`}
                aria-pressed={enabled}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface transition ${
                    enabled ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
