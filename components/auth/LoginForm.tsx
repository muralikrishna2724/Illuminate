"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/registration/fields";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";

/**
 * Participant login (email + registration ID or phone). Organisers use the
 * same form with their password in the second field; that path is
 * deliberately not advertised in the UI (see services/auth-service.ts).
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Please complete this field.";
    if (!secret.trim()) errs.secret = "Please complete this field.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setError(null);
    const res = await authApi.login(email, secret.trim());
    if (res.ok) {
      router.replace(res.data.redirectTo);
      router.refresh();
      return;
    }
    setLoading(false);
    setFieldErrors(res.error.fieldErrors ?? {});
    setError(res.error.message);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {error && (
        <p role="alert" className="rounded-xl border border-[#f08b7a]/50 bg-[#f08b7a]/10 px-4 py-3 text-sm text-[#f7b3a7]">
          {error}
        </p>
      )}
      <TextField
        id="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="username"
        value={email}
        error={fieldErrors.email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="relative">
        <TextField
          id="secret"
          label="Registration ID or phone number"
          type={showSecret ? "text" : "password"}
          autoComplete="current-password"
          autoCapitalize="none"
          spellCheck={false}
          value={secret}
          error={fieldErrors.secret}
          hint="Your registration ID (e.g. ILM-7K3QXZ), or the phone number you registered with."
          onChange={(e) => setSecret(e.target.value)}
          className="[&_input]:pr-16"
        />
        <button
          type="button"
          onClick={() => setShowSecret((v) => !v)}
          aria-pressed={showSecret}
          aria-label={showSecret ? "Hide what you typed" : "Show what you typed"}
          className="absolute right-3 top-[2.6rem] rounded-md px-2 py-1 text-xs text-mist hover:text-flare"
        >
          {showSecret ? "Hide" : "Show"}
        </button>
      </div>
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}
