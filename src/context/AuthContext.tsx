import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { supabase } from '../services/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

/** Fetch the full user profile from public.users */
async function fetchUserProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Profile fetch error:', error);
    return null;
  }
  return data as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial load – check if a session already exists
  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (!cancelled) setUser(profile);
      }
      if (!cancelled) setLoading(false);
    }

    initSession();

    // 2. Listen for future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUser(profile);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
      // We don't set loading here – the initial check already set it to false.
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    // Authenticate with Supabase
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Get the authenticated user's ID
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('User not found after sign-in');

    // Load profile
    const profile = await fetchUserProfile(authUser.id);
    if (!profile) throw new Error('Profile not found in users table');

    // Set user immediately – this updates ProtectedRoute
    setUser(profile);
    // Loading is already false from initial check, but ensure it
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);