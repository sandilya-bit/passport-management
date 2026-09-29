import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const toneClasses: Record<string, string> = {
  primary: 'bg-primary-50 text-primary-700 dark:bg-primary-600/15 dark:text-primary-300',
  secondary: 'bg-secondary-50 text-secondary-700 dark:bg-secondary-500/15 dark:text-secondary-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-100',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-100',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-100',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof toneClasses;
  icon?: string;
  dot?: boolean;
}

export function Badge({ tone = 'neutral', icon, dot, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn('badge-base', toneClasses[tone], className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {icon && <span className="icon text-[14px]" aria-hidden>{icon}</span>}
      {children}
    </span>
  );
}
