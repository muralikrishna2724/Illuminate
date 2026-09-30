"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { chooseTeamTheme } from "@/lib/api/registrations";
import { THEME_REQUIRED_MESSAGE, type HackathonTheme } from "@/lib/events/themes";
import { ThemeChoice } from "./ThemeChoice";

/**
 * Shown only to Deja Vu teams that registered before themes existed. New teams
 * choose their theme on the registration form instead.
 */
export function ThemePickerCard({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [theme, setTheme] = useState<HackathonTheme | "">("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!theme) {
      setError(THEME_REQUIRED_MESSAGE);
      return;
    }
    setSaving(true);
    setError(null);
    const response = await chooseTeamTheme(registrationId, theme);
    setSaving(false);
    if (!response.ok) {
      setError(response.error.message);
      return;
    }
    router.refresh();
  };

  return (
    <section
      aria-labelledby={`theme-${registrationId}`}
      className="rounded-2xl border border-gold/60 bg-gradient-to-br from-powder/60 via-night to-night p-6 sm:p-8"
    >
      <p className="text-xs font-medium tracking-[0.14em] text-gold uppercase">Action needed</p>
      <h3 id={`theme-${registrationId}`} className="mt-2 font-display text-3xl text-flare">
        Choose your team&apos;s theme
      </h3>
      <p className="mt-2 text-sand/85">
        Every Deja Vu team now works in one theme. Your team registered before themes were added, so please choose it here. Any
        member of the team can choose, once; to change it later, contact the organisers.
      </p>
      <form noValidate onSubmit={submit} className="mt-6">
        <ThemeChoice
          idPrefix={`theme-${registrationId}`}
          legend="Theme"
          description={`For registration ${registrationId}.`}
          value={theme}
          error={error ?? undefined}
          disabled={saving}
          onChange={(value) => {
            setTheme(value);
            setError(null);
          }}
        />
        <Button type="submit" loading={saving} className="mt-6">
          Save theme
        </Button>
      </form>
    </section>
  );
}
