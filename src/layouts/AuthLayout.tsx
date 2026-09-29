import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { APP_NAME } from '@/utils/constants';
import { useTheme } from '@/hooks/useTheme';

export function AuthLayout() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark lg:grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-primary-600 lg:block">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(29,155,240,0.5) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(34,197,94,0.25) 0, transparent 40%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <span className="icon text-[22px]">passport</span>
            </span>
            <span className="text-lg font-bold tracking-wide">PAMS</span>
          </Link>

          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="max-w-md text-4xl font-bold leading-tight"
            >
              Passport services, streamlined for every citizen.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-4 max-w-md text-primary-100"
            >
              Apply online, upload documents, book appointments, pay fees and track your
              application — all in one secure government platform.
            </motion.p>
            <ul className="mt-8 space-y-3 text-sm text-primary-50">
              {['End-to-end application tracking', 'Secure document vault', 'Online appointment booking', 'Digital fee payments'].map((f, i) => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.1 }}
                  className="flex items-center gap-2.5"
                >
                  <span className="icon text-[18px] text-secondary-400">check_circle</span>
                  {f}
                </motion.li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-primary-200">© {new Date().getFullYear()} Ministry of External Affairs · e-Governance Initiative</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex min-h-screen flex-col">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
              <span className="icon text-[18px]">passport</span>
            </span>
            <span className="font-bold text-primary-600 dark:text-white">PAMS</span>
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <span className="icon text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
        <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-4 sm:items-center">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthCardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <h1 className="text-2xl font-bold tracking-tight text-ink-light dark:text-ink-dark">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </motion.div>
  );
}

export { APP_NAME };
