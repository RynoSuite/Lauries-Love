import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, currentUserId } from '../lib/supabase';
import { useDefinitions } from '../lib/useDefinitions';
import { Avatar } from '../components/Avatar';

// Another member's profile (/users/:id). Shows their public info and the two
// actions the web app was missing: start a direct message and send a friend
// request. Sensitive PII (email/phone) never loads here — it lives in
// profiles_private (owner-only under RLS), so this page only sees public cols.
type PublicProfile = {
  id: string;
  first_name: string | null;
  display_name: string | null;
  description: string | null;
  avatar_path: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string | null;
  role_id: string | null;
  diagnosis_type_ids: string[] | null;
  diagnosis_subtype_ids: string[] | null;
  diagnosis_year: string | null;
  // Rounded to ~0.7mi at write time by a database trigger, so what arrives
  // here is already an area, not an address.
  latitude: number | null;
  longitude: number | null;
  postCount: number;
  friendCount: number;
};

type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
};

async function fetchPublicProfile(id: string): Promise<PublicProfile | null> {
  const [{ data: profile, error }, posts, friends] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, first_name, display_name, description, avatar_path, city, state, country, created_at, role_id, diagnosis_type_ids, diagnosis_subtype_ids, diagnosis_year, latitude, longitude',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', id),
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .or(`requester_id.eq.${id},addressee_id.eq.${id}`)
      .eq('status', 'accepted'),
  ]);
  if (error || !profile) return null;
  return {
    ...(profile as Omit<PublicProfile, 'postCount' | 'friendCount'>),
    postCount: posts.count ?? 0,
    friendCount: friends.count ?? 0,
  };
}

async function fetchFriendship(otherId: string): Promise<Friendship | null> {
  const me = await currentUserId();
  if (!me) return null;
  const { data } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status')
    .or(
      `and(requester_id.eq.${me},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${me})`,
    )
    .maybeSingle();
  return (data as Friendship) ?? null;
}

export function UserProfile() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [meId, setMeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { label, labels } = useDefinitions();

  useEffect(() => {
    currentUserId().then((m) => {
      setMeId(m);
      // Viewing yourself -> go to the editable own-profile page.
      if (m && m === id) navigate('/profile', { replace: true });
    });
  }, [id, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => fetchPublicProfile(id),
    enabled: !!id,
  });
  const { data: friendship } = useQuery({
    queryKey: ['friendship', id],
    queryFn: () => fetchFriendship(id),
    enabled: !!id && !!meId && meId !== id,
  });

  async function message() {
    setBusy(true);
    setErr(null);
    try {
      const { data: convId, error } = await supabase.rpc(
        'find_or_create_direct_conversation',
        { other_profile: id },
      );
      if (error) throw error;
      navigate(`/messages?c=${convId}`);
    } catch {
      setErr('Could not open the conversation.');
      setBusy(false);
    }
  }

  async function addFriend() {
    if (!meId) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: meId, addressee_id: id, status: 'pending' });
    setBusy(false);
    if (error) setErr('Could not send the request.');
    else qc.invalidateQueries({ queryKey: ['friendship', id] });
  }

  async function acceptFriend() {
    if (!friendship) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendship.id);
    setBusy(false);
    if (error) setErr('Could not accept the request.');
    else qc.invalidateQueries({ queryKey: ['friendship', id] });
  }

  if (isLoading) return <p className="text-heading">Loading…</p>;
  if (!data) return <p className="text-muted">Member not found.</p>;

  const name = data.display_name || data.first_name || 'Member';
  const place = [data.city, data.state, data.country].filter(Boolean).join(', ');
  const isSelf = meId === data.id;
  const roleLabel = label(data.role_id);
  const diagnosisLabels = labels(data.diagnosis_type_ids);
  const subtypeLabels = labels(data.diagnosis_subtype_ids);

  // Friend button reflects the current relationship.
  let friendBtn: { label: string; onClick?: () => void; disabled?: boolean } | null = null;
  if (!isSelf && meId) {
    if (!friendship) friendBtn = { label: 'Add friend', onClick: addFriend };
    else if (friendship.status === 'accepted') friendBtn = { label: 'Friends ✓', disabled: true };
    else if (friendship.addressee_id === meId)
      friendBtn = { label: 'Accept request', onClick: acceptFriend };
    else friendBtn = { label: 'Request sent', disabled: true };
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
        <div className="mb-3 flex justify-center">
          <Avatar path={data.avatar_path} name={name} size={96} />
        </div>
        <h1 className="text-xl font-bold text-heading">{name}</h1>
        {place && <p className="text-sm text-muted">{place}</p>}
        {data.description && <p className="mt-2 text-sm text-muted">{data.description}</p>}
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

        {/* What this member is here for. The mobile profile leads with these,
            and they are the whole reason someone opens a stranger's page in a
            support community: are you like me? */}
        {(roleLabel || diagnosisLabels.length > 0 || data.diagnosis_year) && (
          <dl className="mt-5 space-y-2 border-t border-line pt-4 text-left text-sm">
            {roleLabel && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-faint">Role</dt>
                <dd className="text-body">{roleLabel}</dd>
              </div>
            )}
            {diagnosisLabels.length > 0 && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-faint">Diagnosis</dt>
                <dd className="text-body">{diagnosisLabels.join(', ')}</dd>
              </div>
            )}
            {subtypeLabels.length > 0 && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-faint">Stage</dt>
                <dd className="text-body">{subtypeLabels.join(', ')}</dd>
              </div>
            )}
            {data.diagnosis_year && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-faint">Diagnosed</dt>
                <dd className="text-body">{data.diagnosis_year}</dd>
              </div>
            )}
          </dl>
        )}

        {!isSelf && meId && (
          <div className="mt-6 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={message}
                disabled={busy}
                className="flex-1 rounded-lg bg-magenta py-2 text-sm font-semibold text-white hover:bg-magenta-hi disabled:opacity-50"
              >
                Message
              </button>
              {friendBtn && (
                <button
                  onClick={friendBtn.onClick}
                  disabled={busy || friendBtn.disabled}
                  className="flex-1 rounded-lg border border-line py-2 text-sm font-semibold text-heading hover:bg-surface-2 disabled:opacity-60"
                >
                  {friendBtn.label}
                </button>
              )}
            </div>
            {/* Only offered when there is somewhere to go. The map centres on
                their approximate area, not an address. */}
            {data.latitude != null && data.longitude != null && (
              <Link
                to={`/map?lat=${data.latitude}&lng=${data.longitude}`}
                className="block w-full rounded-lg border border-line py-2 text-center text-sm font-semibold text-heading transition-colors hover:border-magenta hover:text-magenta-text"
              >
                View on map
              </Link>
            )}
          </div>
        )}
        {err && <p className="mt-3 text-sm text-danger">{err}</p>}
      </div>
    </div>
  );
}
