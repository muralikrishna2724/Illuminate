"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/registration/fields";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Please complete this field.";
    if (!password) errs.password = "Please complete this field.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setError(null);
    const res = await adminApi.login(email, password);
    if (res.ok) {
      router.replace("/admin/dashboard");
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
      <TextField id="email" label="Email" type="email" autoComplete="username" value={email} error={fieldErrors.email} onChange={(e) => setEmail(e.target.value)} />
      <TextField
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        error={fieldErrors.password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" loading={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
