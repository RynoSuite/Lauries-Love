import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Staff source of truth is Jeremy's support_staff table: role = owner | agent.
// 'owner' is admin-level; any row = staff.
type StaffRole = 'owner' | 'agent';

type AuthState = {
  session: Session | null;
  loading: boolean;
  roles: StaffRole[];
  isStaff: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const lastUserId = useRef<string | null>(null);

  /**
   * Throw away every cached query when the signed-in account changes.
   *
   * Signing out ended the Supabase session but left the React Query cache
   * untouched, and none of the query keys carry a user id — so the next
   * account walked into a cache full of the previous one's data and saw it
   * instantly on every screen it had already visited. A full page load fixed
   * it only because that discards the in-memory cache.
   *
   * Cleared on the transition away from a signed-in user, which covers both
   * signing out and switching accounts. The first sign-in of a page load is
   * not a transition and does not clear, so it never cancels the queries a
   * freshly loaded page has already started.
   */
  useEffect(() => {
    const id = session?.user?.id ?? null;
    const previous = lastUserId.current;
    lastUserId.current = id;
    if (previous && previous !== id) queryClient.clear();
  }, [session?.user?.id, queryClient]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load staff roles once signed in, from support_staff (the shared staff
  // table). No rows = regular member.
  useEffect(() => {
    if (!session?.user?.id) {
      setRoles([]);
      return;
    }
    supabase
      .from('support_staff')
      .select('role')
      .eq('profile_id', session.user.id)
      .then(({ data, error }) => {
        if (error) {
          setRoles([]);
          return;
        }
        setRoles((data ?? []).map((r: { role: StaffRole }) => r.role));
      });
  }, [session?.user?.id]);

  const value: AuthState = {
    session,
    loading,
    roles,
    isStaff: roles.length > 0,
    isAdmin: roles.includes('owner'),
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    // Self-serve member signup. The handle_new_user auth trigger creates the
    // profile rows; we then set the chosen display name. If the project
    // requires email confirmation, data.session is null and the caller shows a
    // "check your email" message instead of logging straight in.
    async signUp(email, password, displayName) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName, first_name: displayName } },
      });
      if (error) throw error;
      if (data.session?.user?.id) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName })
          .eq('id', data.session.user.id);
      }
      return { needsConfirmation: !data.session };
    },
    async signOut() {
      await supabase.auth.signOut();
      // Also here, not only in the effect above: this runs before the auth
      // listener fires, so nothing renders the departing account's data in
      // the gap.
      queryClient.clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
