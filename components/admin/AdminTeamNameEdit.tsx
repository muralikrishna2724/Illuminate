"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";

/** Organisers rename a Deja Vu team from the detail panel. */
export function AdminTeamNameEdit({
  registrationId,
  current,
  onSaved,
}: {
  registrationId: string;
  current: string;
  onSaved: (name: string) => void;
}) {
  const [value, setValue] = useState(current);
  const [saved, setSaved] = useState(current);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const trimmed = value.trim();

  const save = async () => {
    if (!trimmed || trimmed === saved || saving) return;
    setSaving(true);
    setMessage(null);
    const res = await adminApi.setTeamName(registrationId, trimmed);
    setSaving(false);
    if (res.ok) {
      setSaved(res.data.name);
      setValue(res.data.name);
      onSaved(res.data.name);
      setMessage({ tone: "ok", text: `Saved: ${res.data.name}` });
    } else {
      setMessage({ tone: "bad", text: res.error.fieldErrors?.name ?? res.error.message });
    }
  };

  const inputId = `admin-team-name-${registrationId}`;
  return (
    <form
      className="mt-1"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Team name
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id={inputId}
          value={value}
          maxLength={60}
          autoComplete="off"
          onChange={(e) => {
            setValue(e.target.value);
            setMessage(null);
          }}
          className="field-input w-auto min-w-56 flex-1 text-lg"
        />
        <Button type="submit" size="sm" variant="secondary" loading={saving} disabled={!trimmed || trimmed === saved}>
          Save name
        </Button>
      </div>
      {message && (
        <p role="status" className={`mt-1.5 text-sm ${message.tone === "ok" ? "text-ok" : "text-bad"}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}
