import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSession, User } from '@/types';
import { isMockMode, mockLogin, mockRegister, mockForgotPassword, mockResetPassword } from '@/api/mockApi';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasRestored: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { fullName: string; email: string; phone: string; password: string }) => Promise<User>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string) => Promise<string>;
  refreshSession: () => Promise<string | null>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasRestored: false,

      login: async (email, password) => {
        if (isMockMode) {
          const session = await mockLogin({ email, password });
          set({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken, isAuthenticated: true });
          return session.user;
        }
        const { authService } = await import('@/services/authService');
        const session: AuthSession = await authService.login({ email, password });
        set({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken, isAuthenticated: true });
        return session.user;
      },

      register: async (payload) => {
        if (isMockMode) return mockRegister(payload);
        const { authService } = await import('@/services/authService');
        const session = await authService.register(payload);
        set({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken, isAuthenticated: true });
        return session.user;
      },

      forgotPassword: async (email) => {
        if (isMockMode) return mockForgotPassword(email).then((r) => r.message);
        const { authService } = await import('@/services/authService');
        return authService.forgotPassword(email);
      },

      resetPassword: async (token, password) => {
        if (isMockMode) return mockResetPassword(token, password).then((r) => r.message);
        const { authService } = await import('@/services/authService');
        return authService.resetPassword(token, password);
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return null;
        if (isMockMode) return get().accessToken;
        const { authService } = await import('@/services/authService');
        try {
          const session = await authService.refresh(refreshToken);
          set({ accessToken: session.accessToken, user: session.user, isAuthenticated: true });
          return session.accessToken;
        } catch {
          return null;
        }
      },

      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, hasRestored: true }),
    }),
    {
      name: 'pams-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasRestored = true;
      },
    },
  ),
);
