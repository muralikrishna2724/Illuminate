"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "./fields";

const PATTERN = /^INV-\d{2,}$/;

export function StatusLookupForm({ initialValue = "" }: { initialValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const code = value.trim().toUpperCase().replace(/\s+/g, "");
    if (!code) return setError("Please complete this field.");
    if (!PATTERN.test(code)) return setError("Registration IDs look like INV-07.");
    setError(undefined);
    setPending(true);
    router.push(`/registration/${code}`);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <TextField
        id="registrationId"
        label="Registration ID"
        placeholder="INV-07"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        value={value}
        error={error}
        className="flex-1"
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" size="lg" loading={pending} className="sm:mt-7">
        Check status
      </Button>
    </form>
  );
}
