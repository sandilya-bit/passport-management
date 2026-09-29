import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (t: { tone: ToastTone; title: string; message?: string }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneConfig: Record<ToastTone, { icon: string; bar: string; iconBg: string }> = {
  success: { icon: 'check_circle', bar: 'bg-success-500', iconBg: 'text-success-500' },
  error: { icon: 'error', bar: 'bg-danger-500', iconBg: 'text-danger-500' },
  warning: { icon: 'warning', bar: 'bg-warning-500', iconBg: 'text-warning-500' },
  info: { icon: 'info', bar: 'bg-secondary-500', iconBg: 'text-secondary-500' },
};

let toastSeq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ tone, title, message }: { tone: ToastTone; title: string; message?: string }) => {
      const id = ++toastSeq;
      setToasts((prev) => [...prev.slice(-4), { id, tone, title, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const cfg = toneConfig[t.tone];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                className={cn(
                  'pointer-events-auto relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700',
                  'bg-white dark:bg-slate-900 shadow-lg flex items-start gap-3 p-4',
                )}
              >
                <span className={cn('absolute left-0 top-0 h-full w-1', cfg.bar)} aria-hidden />
                <span className={cn('icon text-[22px]', cfg.iconBg)} aria-hidden>
                  {cfg.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-light dark:text-ink-dark">{t.title}</p>
                  {t.message && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.message}</p>}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="icon text-[18px]">close</span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
