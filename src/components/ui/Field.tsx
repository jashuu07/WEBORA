'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface WrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, required, className, children }: WrapperProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label className="text-[0.82rem] font-semibold text-[#33373f]">
          {label}
          {required ? <span className="ml-0.5 text-[var(--accent)]">*</span> : null}
          {hint ? <span className="ml-1.5 font-normal text-[var(--text-muted)]">{hint}</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[0.78rem] font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leading?: React.ReactNode;
}

export function TextInput({ label, hint, error, leading, className, ...rest }: TextInputProps) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={rest.required}>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#a8a29a]">{leading}</span>
        ) : null}
        <input id={id} className={cn('input', leading && 'pl-9', error && 'border-red-300', className)} {...rest} />
      </div>
    </Field>
  );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function TextArea({ label, hint, error, className, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={rest.required}>
      <textarea id={id} className={cn('textarea', error && 'border-red-300', className)} {...rest} />
    </Field>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Select({ label, hint, error, className, children, ...rest }: SelectProps) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={rest.required}>
      <select id={id} className={cn('select', error && 'border-red-300', className)} {...rest}>
        {children}
      </select>
    </Field>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-[0.85rem] font-medium text-[var(--text)]">{label}</p>
        {description ? <p className="mt-0.5 text-[0.76rem] leading-relaxed text-[var(--text-muted)]">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200',
          checked ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--line-strong)] bg-[#ece9e4]',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
          style={{ height: 18, width: 18 }}
        />
      </button>
    </div>
  );
}
