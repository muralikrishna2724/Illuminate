"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";
import { HACKATHON_THEMES, type HackathonTheme } from "@/lib/events/themes";

/** Organisers set or change a Deja Vu team's theme from the detail panel. */
export function AdminThemeSelect({
  registrationId,
  current,
  onSaved,
}: {
  registrationId: string;
  /** Current theme label, or null when the team hasn't chosen. */
  current: string | null;
  onSaved: (label: string) => void;
}) {
  const currentValue = HACKATHON_THEMES.find((t) => t.label === current)?.value ?? "";
  const [value, setValue] = useState<HackathonTheme | "">(currentValue);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const save = async () => {
    if (!value || saving) return;
    setSaving(true);
    setMessage(null);
    const res = await adminApi.setTheme(registrationId, value);
    setSaving(false);
    if (res.ok) {
      onSaved(res.data.theme);
      setMessage({ tone: "ok", text: `Saved: ${res.data.theme}` });
    } else {
      setMessage({ tone: "bad", text: res.error.message });
    }
  };

  const selectId = `admin-theme-${registrationId}`;
  return (
    <div className="sm:col-span-2">
      <label htmlFor={selectId} className="text-xs text-mist">
        Theme
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <select
          id={selectId}
          value={value}
          onChange={(e) => {
            setValue(e.target.value as HackathonTheme);
            setMessage(null);
          }}
          className="field-input w-auto min-w-56"
        >
          <option value="" disabled>
            Not chosen yet
          </option>
          {HACKATHON_THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" variant="secondary" loading={saving} disabled={!value || value === currentValue} onClick={save}>
          Save theme
        </Button>
      </div>
      {message && (
        <p role="status" className={`mt-1.5 text-sm ${message.tone === "ok" ? "text-ok" : "text-bad"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
