import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightSlot, containerClassName, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="label-base">
            {label}
            {props.required && <span className="text-danger-500"> *</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 icon text-slate-400 text-[20px]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn('input-base', leftIcon && 'pl-10', rightSlot && 'pr-10', error && 'input-error', className)}
            {...props}
          />
          {rightSlot && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-500">
            <span className="icon text-[14px]">error</span>
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, containerClassName, id, ...props }, ref) => {
    const selectId = id ?? props.name;
    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="label-base">
            {label}
            {props.required && <span className="text-danger-500"> *</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={cn('input-base appearance-none pr-9 bg-no-repeat', error && 'input-error', className)}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            backgroundPosition: 'right 12px center',
          }}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error ? (
          <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-500">
            <span className="icon text-[14px]">error</span>
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const areaId = id ?? props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={areaId} className="label-base">
            {label}
            {props.required && <span className="text-danger-500"> *</span>}
          </label>
        )}
        <textarea ref={ref} id={areaId} aria-invalid={!!error} className={cn('input-base min-h-[96px] resize-y', error && 'input-error', className)} {...props} />
        {error ? (
          <p role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-500">
            <span className="icon text-[14px]">error</span>
            {error}
          </p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
