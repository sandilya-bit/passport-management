import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { cn } from '@/utils/cn';

export function DashboardLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className={cn('flex min-h-screen flex-col lg:pl-64')}>
        <Navbar onMenuClick={() => setMobileNavOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 text-center text-xs text-slate-400">
          Passport Application Management System · Government e-Services Platform
        </footer>
      </div>
    </div>
  );
}
