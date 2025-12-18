import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

interface User {
  id: string;
  supabaseId?: string;
  email: string;
  fullName: string;
  status?: string;
  lawyerType?: string;
  role?: string;
  userType: 'lawyer' | 'admin';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
  getAccessToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: async (user, accessToken, refreshToken) => {
        // Store token in state
        set({ user, accessToken, isAuthenticated: true });

        // Manually persist to localStorage immediately to avoid race condition
        // when navigating before Zustand's async persist completes
        const state = { user, accessToken, isAuthenticated: true };
        localStorage.setItem('auth-storage', JSON.stringify({ state, version: 0 }));

        // Also set the session in Supabase client for token refresh
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      setHasHydrated: (state) => set({ hasHydrated: state }),

      getAccessToken: () => get().accessToken,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Listen to Supabase auth state changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
    } else if (session?.access_token) {
      // Keep store in sync with Supabase session (handles token refresh, etc.)
      const currentToken = useAuthStore.getState().accessToken;
      if (currentToken !== session.access_token) {
        useAuthStore.setState({ accessToken: session.access_token });
      }
    }
  });
}
