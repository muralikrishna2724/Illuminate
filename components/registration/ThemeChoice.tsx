"use client";

import { HACKATHON_THEMES, type HackathonTheme } from "@/lib/events/themes";

/** Deja Vu theme picker: one required choice, shown as cards. */
export function ThemeChoice({
  value,
  onChange,
  error,
  disabled,
  idPrefix = "theme",
  legend = "Theme",
  description = "Choose the theme your team will build for.",
}: {
  value: HackathonTheme | "" | undefined;
  onChange: (theme: HackathonTheme) => void;
  error?: string;
  disabled?: boolean;
  idPrefix?: string;
  legend?: string;
  description?: string;
}) {
  const errorId = `${idPrefix}-error`;
  return (
    <fieldset aria-describedby={error ? errorId : undefined} disabled={disabled}>
      <legend className="text-lg text-flare">{legend}</legend>
      <p className="mt-1 text-sm text-mist">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {HACKATHON_THEMES.map((theme) => {
          const checked = value === theme.value;
          return (
            <label
              key={theme.value}
              htmlFor={`${idPrefix}-${theme.value}`}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
                checked ? "border-gold bg-powder/40 text-flare" : "border-[var(--line-strong)] text-sand hover:border-gold/60"
              } ${error && !checked ? "border-bad/60" : ""}`}
            >
              <input
                id={`${idPrefix}-${theme.value}`}
                type="radio"
                name="theme"
                value={theme.value}
                checked={checked}
                onChange={() => onChange(theme.value)}
                required
                className="h-4 w-4 shrink-0 accent-[var(--color-gold)]"
              />
              <span className="font-medium">{theme.label}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-bad">
          {error}
        </p>
      )}
    </fieldset>
  );
}
