import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { APP_SHORT, ROLE_LABELS } from '@/utils/constants';
import type { Role } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: Role[];
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'space_dashboard', end: true },
  { to: '/applications', label: 'Applications', icon: 'description' },
  { to: '/applicants', label: 'Applicants', icon: 'groups', roles: ['ADMIN', 'PASSPORT_OFFICER', 'VERIFICATION_OFFICER'] },
  { to: '/documents', label: 'Documents', icon: 'folder_shared' },
  { to: '/appointments', label: 'Appointments', icon: 'event_available' },
  { to: '/payments', label: 'Payments', icon: 'payments' },
  { to: '/verification', label: 'Verification', icon: 'fact_check', roles: ['ADMIN', 'VERIFICATION_OFFICER', 'PASSPORT_OFFICER'] },
  { to: '/passports', label: 'Passports', icon: 'card_travel', roles: ['ADMIN', 'PASSPORT_OFFICER'] },
  { to: '/admin', label: 'System Admin', icon: 'admin_panel_settings', roles: ['ADMIN'] },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-primary-700/40 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-500 text-white shadow-glow">
          <span className="icon text-[20px]">passport</span>
        </span>
        <div>
          <p className="text-sm font-bold tracking-wide text-white">{APP_SHORT}</p>
          <p className="text-[10px] uppercase tracking-widest text-primary-200">Passport Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-primary-100/80 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'icon text-[21px] transition-transform group-hover:scale-110',
                    isActive ? 'text-secondary-400' : 'text-primary-200/70',
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <motion.span layoutId="sidebar-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary-400" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-primary-700/40 p-4">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs font-medium text-white">{user?.fullName ?? 'Guest'}</p>
          <p className="mt-0.5 text-[11px] text-primary-200">{user ? ROLE_LABELS[user.role] : ''}</p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-primary-600 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
              onClick={onClose}
              aria-hidden
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative h-full w-72 bg-primary-600 shadow-2xl"
            >
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
