import { createClient } from '@supabase/supabase-js';

// Same Supabase project as the mobile apps — accounts, posts, groups, chats,
// notifications all synced across iOS, Android, and web.
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  // Fail loudly in dev rather than producing confusing auth errors.
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, copy web/.env.example to web/.env and fill from app/.env',
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// Resolves the single active org id (Laurie's Love) via the default_org_id()
// RPC. Needed as the conflict target when upserting org-scoped settings.
export async function currentOrgId(): Promise<string | null> {
  const { data, error } = await supabase.rpc('default_org_id');
  if (error) return null;
  return (data as string | null) ?? null;
}
