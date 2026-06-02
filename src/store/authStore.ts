import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticating: false,
  error: null,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error && profile) {
          const user = profile as User;
          if (!user.is_active) {
            // Inactive user – force sign out
            await supabase.auth.signOut();
            set({ user: null, isLoading: false, error: 'Account deactivated. Contact MD.' });
            return;
          }
          set({ user, isLoading: false, error: null });
        } else {
          await supabase.auth.signOut();
          set({ user: null, isLoading: false, error: null });
        }
      } else {
        set({ user: null, isLoading: false, error: null });
      }
    } catch {
      set({ user: null, isLoading: false, error: null });
    }
  },

  signIn: async (email, password) => {
    set({ isAuthenticating: true, error: null });
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) throw new Error('User not found after sign-in');

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('User profile not found');

      const user = profile as User;
      if (!user.is_active) {
        // Immediately sign out the inactive user
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Contact the Managing Director.');
      }

      set({ user, isAuthenticating: false, error: null });
    } catch (err: any) {
      set({ error: err.message, isAuthenticating: false });
      throw err;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, isLoading: false, error: null });
  },
}));