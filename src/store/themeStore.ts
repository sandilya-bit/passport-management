import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') as Theme,
      toggle: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      set: (theme) => set({ theme }),
    }),
    { name: 'pams-theme' },
  ),
);

/** Applies the `dark` class to <html>; call once at bootstrap. */
export const initTheme = (): void => {
  const apply = (t: Theme): void => {
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.style.colorScheme = t;
  };
  apply(useThemeStore.getState().theme);
  useThemeStore.subscribe((s) => apply(s.theme));
};
