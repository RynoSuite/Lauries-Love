import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { PageTitle } from '../../components/PageTitle';

// Member management: search, alphabetical sort, and (owners only) grant/revoke
// staff roles by writing Jeremy's support_staff table (owner | agent).
// NOTE: member email/phone live in profiles_private. Jeremy's pp_select_staff
// policy already lets SUPPORT STAFF read them (for contact during support), so
// a staff-readable contact column can be added here by joining profiles_private
// — left out of this first pass for a clean list; easy to add.
type Member = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_path: string | null;
  active: boolean;
  created_at: string;
};
type StaffRow = { profile_id: string; role: 'owner' | 'agent' };

// What each stored role is called in the interface.
//   owner — full administrator: everything an agent can do, plus managing the
//           staff roster itself and the branding console.
//   agent — support staff: tickets and moderation, but cannot add, remove or
//           promote staff. That split is deliberate, so a compromised agent
//           account cannot enrol accomplices or remove the owner.
const ROLE_LABEL: Record<'owner' | 'agent', string> = {
  owner: 'Admin',
  agent: 'Support agent',
};

async function fetchMembers(search: string): Promise<Member[]> {
  let q = supabase
    .from('profiles')
    .select('id, first_name, last_name, display_name, avatar_path, active, created_at')
    .order('display_name', { ascending: true, nullsFirst: false })
    .limit(200);
  if (search.trim()) {
    const s = `%${search.trim()}%`;
    q = q.or(`display_name.ilike.${s},first_name.ilike.${s},last_name.ilike.${s}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

async function fetchStaff(): Promise<Record<string, 'owner' | 'agent'>> {
  const { data } = await supabase.from('support_staff').select('profile_id, role');
  const map: Record<string, 'owner' | 'agent'> = {};
  (data ?? []).forEach((r: StaffRow) => (map[r.profile_id] = r.role));
  return map;
}

export function AdminMembers() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const members = useQuery({
    queryKey: ['members', search],
    queryFn: () => fetchMembers(search),
  });
  const staff = useQuery({ queryKey: ['staff-map'], queryFn: fetchStaff });

  const setRole = useMutation({
    mutationFn: async (v: { id: string; role: 'owner' | 'agent' | null }) => {
      if (v.role === null) {
        const { error } = await supabase
          .from('support_staff')
          .delete()
          .eq('profile_id', v.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('support_staff')
          .upsert({ profile_id: v.id, role: v.role });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-map'] }),
  });

  const staffMap = staff.data ?? {};

  return (
    <div>
      <PageTitle>Members</PageTitle>
      <p className="mb-4 text-sm text-muted">
        Search and manage members. {isAdmin ? 'You can grant staff roles.' : 'Owner access required to change roles.'}
      </p>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name…"
        className="mb-4 w-full max-w-sm rounded-lg border border-line-strong px-3 py-2 text-sm outline-none focus:border-magenta"
      />
      {members.isLoading && <p className="text-heading">Loading…</p>}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs tracking-wide text-faint">
            <th className="py-2">Member</th>
            <th>Joined</th>
            <th>Status</th>
            <th>Role</th>
            {isAdmin && <th></th>}
          </tr>
        </thead>
        <tbody>
          {(members.data ?? []).map((m) => {
            const name = m.display_name || m.first_name || 'Member';
            const role = staffMap[m.id];
            return (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{name}</td>
                <td className="text-muted">
                  {new Date(m.created_at).toLocaleDateString()}
                </td>
                <td>
                  <span className={m.active ? 'text-success' : 'text-faint'}>
                    {m.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {role ? (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-heading">
                      {ROLE_LABEL[role]}
                    </span>
                  ) : (
                    <span className="text-faint">Member</span>
                  )}
                </td>
                {isAdmin && (
                  <td className="py-2 text-right">
                    <select
                      value={role ?? ''}
                      onChange={(e) =>
                        setRole.mutate({
                          id: m.id,
                          role: (e.target.value || null) as 'owner' | 'agent' | null,
                        })
                      }
                      className="rounded border border-line-strong px-2 py-1 text-xs"
                    >
                      <option value="">Member</option>
                      <option value="agent">Support agent</option>
                      <option value="owner">Admin</option>
                    </select>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
