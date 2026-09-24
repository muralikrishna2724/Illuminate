"use client";

import type { ComponentProps, ReactNode } from "react";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FieldShell({ id, label, error, hint, children, className = "" }: FieldShellProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm text-sand">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-smoke">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-[#f4a193]">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export function TextField({
  id,
  label,
  error,
  hint,
  className,
  ...input
}: Omit<ComponentProps<"input">, "id"> & { id: string; label: string; error?: string; hint?: ReactNode }) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <input
        id={id}
        name={id}
        required
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="field-input"
        {...input}
      />
    </FieldShell>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  options,
  placeholder = "Select…",
  className,
  ...select
}: Omit<ComponentProps<"select">, "id"> & {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} className={className}>
      <select
        id={id}
        name={id}
        required
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="field-input"
        {...select}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
