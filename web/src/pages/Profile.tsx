import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';

type MyProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  description: string | null;
  avatar_path: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string | null;
  email: string | null;
  phone: string | null;
  postCount: number;
  friendCount: number;
};

// Own profile. Reads the public row + the caller's own profiles_private
// (owner-only, so email/phone only ever show for yourself).
async function fetchMyProfile(): Promise<MyProfile | null> {
  const me = await currentUserId();
  if (!me) return null;
  const [{ data: profile }, { data: priv }, posts, friends] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, first_name, last_name, display_name, description, avatar_path, city, state, country, created_at',
      )
      .eq('id', me)
      .single(),
    supabase
      .from('profiles_private')
      .select('email, phone_number')
      .eq('profile_id', me)
      .maybeSingle(),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', me),
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .or(`requester_id.eq.${me},addressee_id.eq.${me}`)
      .eq('status', 'accepted'),
  ]);
  return {
    ...(profile as Omit<MyProfile, 'email' | 'phone' | 'postCount' | 'friendCount'>),
    email: priv?.email ?? null,
    phone: priv?.phone_number ?? null,
    postCount: posts.count ?? 0,
    friendCount: friends.count ?? 0,
  };
}

function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl ?? null;
}

// Admin-defined custom profile fields + the caller's own values. Only enabled
// fields are returned to members (RLS: enabled or owner).
type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'date';
type CustomField = {
  id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  options: string[];
  position: number;
};

async function fetchCustomFields(): Promise<CustomField[]> {
  const { data, error } = await supabase
    .from('custom_profile_fields')
    .select('id, field_key, label, field_type, options, position')
    .eq('enabled', true)
    .order('position');
  if (error) throw error;
  return (data ?? []).map((f) => ({
    ...(f as CustomField),
    options: Array.isArray((f as { options: unknown }).options)
      ? ((f as { options: string[] }).options)
      : [],
  }));
}

async function fetchMyFieldValues(): Promise<Record<string, string>> {
  const me = await currentUserId();
  if (!me) return {};
  const { data } = await supabase
    .from('profile_field_values')
    .select('field_id, value')
    .eq('profile_id', me);
  const map: Record<string, string> = {};
  (data ?? []).forEach((r) => {
    const row = r as { field_id: string; value: string | null };
    if (row.value != null) map[row.field_id] = row.value;
  });
  return map;
}

function formatFieldValue(field: CustomField, value: string): string {
  if (field.field_type === 'boolean') return value === 'true' ? 'Yes' : 'No';
  if (field.field_type === 'date') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString();
  }
  return value;
}

type EditForm = {
  display_name: string;
  description: string;
  email: string;
  phone: string;
};

export function Profile() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-profile'], queryFn: fetchMyProfile });
  const { data: fields } = useQuery({
    queryKey: ['profile-custom-fields'],
    queryFn: fetchCustomFields,
  });
  const { data: myValues } = useQuery({
    queryKey: ['profile-field-values'],
    queryFn: fetchMyFieldValues,
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>({
    display_name: '',
    description: '',
    email: '',
    phone: '',
  });
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setForm({
        display_name: data.display_name ?? '',
        description: data.description ?? '',
        email: data.email ?? '',
        phone: data.phone ?? '',
      });
    }
  }, [data]);

  useEffect(() => {
    if (myValues) setFieldValues(myValues);
  }, [myValues]);

  const setFieldValue = (id: string, value: string) =>
    setFieldValues((prev) => ({ ...prev, [id]: value }));

  const save = useMutation({
    mutationFn: async (payload: { form: EditForm; values: Record<string, string> }) => {
      const me = await currentUserId();
      if (!me) throw new Error('Not signed in');
      const { form: f, values } = payload;
      const { error: pErr } = await supabase
        .from('profiles')
        .update({
          display_name: f.display_name.trim() || null,
          description: f.description.trim() || null,
        })
        .eq('id', me);
      if (pErr) throw pErr;
      const { error: privErr } = await supabase
        .from('profiles_private')
        .upsert(
          {
            profile_id: me,
            email: f.email.trim() || null,
            phone_number: f.phone.trim() || null,
          },
          { onConflict: 'profile_id' },
        );
      if (privErr) throw privErr;
      // Custom field values: upsert one row per enabled field (empty -> null).
      const rows = (fields ?? []).map((field) => {
        const raw = values[field.id];
        const clean = raw != null && raw.toString().trim() !== '' ? raw : null;
        return {
          profile_id: me,
          field_id: field.id,
          value: clean,
          updated_at: new Date().toISOString(),
        };
      });
      if (rows.length) {
        const { error: fvErr } = await supabase
          .from('profile_field_values')
          .upsert(rows, { onConflict: 'profile_id,field_id' });
        if (fvErr) throw fvErr;
      }
    },
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['profile-field-values'] });
    },
  });

  const inputClass =
    'w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta';

  function renderFieldInput(field: CustomField) {
    const val = fieldValues[field.id] ?? '';
    switch (field.field_type) {
      case 'textarea':
        return (
          <textarea
            value={val}
            rows={3}
            onChange={(e) => setFieldValue(field.id, e.target.value)}
            className={`${inputClass} resize-none`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={val}
            onChange={(e) => setFieldValue(field.id, e.target.value)}
            className={inputClass}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={val}
            onChange={(e) => setFieldValue(field.id, e.target.value)}
            className={inputClass}
          />
        );
      case 'select':
        return (
          <select
            value={val}
            onChange={(e) => setFieldValue(field.id, e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={val === 'true'}
              onChange={(e) => setFieldValue(field.id, e.target.checked ? 'true' : 'false')}
            />
            <span className="text-muted">Yes</span>
          </label>
        );
      default:
        return (
          <input
            value={val}
            onChange={(e) => setFieldValue(field.id, e.target.value)}
            className={inputClass}
          />
        );
    }
  }

  if (isLoading) return <p className="text-heading">Loading…</p>;
  if (!data) return <p className="text-muted">Not signed in.</p>;

  const name = data.display_name || data.first_name || 'Member';
  const img = avatarUrl(data.avatar_path);
  const place = [data.city, data.state, data.country].filter(Boolean).join(', ');

  if (editing) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h1 className="mb-4 text-xl font-bold text-heading">Edit profile</h1>
          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-muted">Display name</span>
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
            />
          </label>
          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-muted">Bio</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
            />
          </label>
          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-muted">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
            />
          </label>
          <label className="mb-4 block text-sm">
            <span className="mb-1 block text-muted">Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-line px-3 py-2 outline-none focus:border-magenta"
            />
          </label>

          {(fields ?? []).length > 0 && (
            <div className="mb-4 border-t pt-4">
              <div className="mb-2 text-xs font-semibold tracking-wide text-faint">
                More about you
              </div>
              {(fields ?? []).map((field) => (
                <label key={field.id} className="mb-3 block text-sm">
                  <span className="mb-1 block text-muted">{field.label}</span>
                  {renderFieldInput(field)}
                </label>
              ))}
            </div>
          )}

          {save.isError && (
            <p className="mb-3 text-sm text-danger">Couldn’t save — try again.</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => save.mutate({ form, values: fieldValues })}
              disabled={save.isPending}
              className="rounded-lg bg-magenta px-4 py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-4 py-2 text-sm text-muted hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
        {img ? (
          <img src={img} alt="" className="mx-auto mb-3 h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="mx-auto mb-3 grid h-24 w-24 place-items-center rounded-full bg-magenta text-3xl font-bold text-white">
            {name[0]}
          </div>
        )}
        <h1 className="text-xl font-bold text-heading">{name}</h1>
        {place && <p className="text-sm text-muted">{place}</p>}
        {data.description && (
          <p className="mt-2 text-sm text-muted">{data.description}</p>
        )}
        <p className="mt-1 text-xs text-faint">
          Joined {data.created_at ? new Date(data.created_at).toLocaleDateString() : ''}
        </p>

        <div className="mt-4 flex justify-center gap-8">
          <div>
            <div className="text-lg font-bold text-magenta-text">{data.postCount}</div>
            <div className="text-xs text-faint">Posts</div>
          </div>
          <div>
            <div className="text-lg font-bold text-magenta-text">{data.friendCount}</div>
            <div className="text-xs text-faint">Friends</div>
          </div>
        </div>

        <div className="mt-6 space-y-1 border-t pt-4 text-left text-sm">
          {data.email && (
            <div>
              <span className="text-faint">Email: </span>
              {data.email}
            </div>
          )}
          {data.phone && (
            <div>
              <span className="text-faint">Phone: </span>
              {data.phone}
            </div>
          )}
          {(fields ?? []).map((field) => {
            const v = fieldValues[field.id];
            if (!v || v.trim() === '' || (field.field_type === 'boolean' && v !== 'true'))
              return null;
            return (
              <div key={field.id}>
                <span className="text-faint">{field.label}: </span>
                {formatFieldValue(field, v)}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setEditing(true)}
          className="mt-6 w-full rounded-lg bg-magenta py-2 text-sm font-semibold text-white hover:bg-magenta-hi"
        >
          Edit profile
        </button>
      </div>
    </div>
  );
}
