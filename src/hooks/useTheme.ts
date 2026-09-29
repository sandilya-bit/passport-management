import { useThemeStore } from '@/store/themeStore';

export const useTheme = () => {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  return { theme, toggle, isDark: theme === 'dark' };
};
