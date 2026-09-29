import { useAuthStore } from '@/store/authStore';

export const useAuth = () =>
  useAuthStore((s) => ({
    user: s.user,
    isAuthenticated: s.isAuthenticated,
    hasRestored: s.hasRestored,
  }));

export const useAuthActions = () =>
  useAuthStore.getState().logout;

export const useRole = () => useAuthStore((s) => s.user?.role ?? null);
