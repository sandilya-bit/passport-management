import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';
import { initials } from '@/utils/format';
import { ROLE_LABELS } from '@/utils/constants';
import { cn } from '@/utils/cn';

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isDark, toggle } = useTheme();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 px-4 sm:px-6 backdrop-blur">
      <button
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
      >
        <span className="icon text-[22px]">menu</span>
      </button>

      <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
        <span className="icon text-[18px]">calendar_month</span>
        {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isDark ? 'dark' : 'light'}
              initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="icon text-[21px] block"
            >
              {isDark ? 'light_mode' : 'dark_mode'}
            </motion.span>
          </AnimatePresence>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserMenuOpen(false); }}
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="icon text-[21px]">notifications</span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white dark:ring-slate-950" />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                  <p className="text-sm font-semibold text-ink-light dark:text-ink-dark">Notifications</p>
                </div>
                <ul className="max-h-72 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
                  {[
                    { icon: 'fact_check', tone: 'text-success-500', title: 'Verification passed', time: '2h ago', body: 'PAS20253042 police verification approved.' },
                    { icon: 'event_available', tone: 'text-secondary-500', title: 'Appointment reminder', time: '5h ago', body: 'PSK visit scheduled for tomorrow 10:30 AM.' },
                    { icon: 'payments', tone: 'text-warning-500', title: 'Payment pending', time: '1d ago', body: 'Complete the fee payment for PAS20253033.' },
                  ].map((n, i) => (
                    <li key={i} className="flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <span className={cn(n.tone, 'icon text-[20px]')}>{n.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-light dark:text-ink-dark">{n.title}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{n.body}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">{n.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setUserMenuOpen((v) => !v); setNotifOpen(false); }}
            aria-label="Open user menu"
            className="flex items-center gap-2.5 rounded-lg py-1.5 pl-1.5 pr-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {initials(user?.fullName ?? 'U')}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-sm font-semibold text-ink-light dark:text-ink-dark leading-tight">{user?.fullName}</span>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                {user ? ROLE_LABELS[user.role] : ''}
              </span>
            </span>
            <span className="icon text-[18px] text-slate-400">expand_more</span>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-ink-light dark:text-ink-dark">{user?.fullName}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="icon text-[19px]">person</span> My Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-500/10"
                  >
                    <span className="icon text-[19px]">logout</span> Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
