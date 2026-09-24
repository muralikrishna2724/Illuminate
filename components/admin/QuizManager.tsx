"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api/admin";
import type { Quiz, QuizAccessRule } from "@/types/domain";
import { formatDateTime } from "./format";

/** Add / update the Deja Vu quiz URL, enable/disable it, and choose who can see it. */
export function QuizManager({ initial }: { initial: Quiz }) {
  const [saved, setSaved] = useState<Quiz>(initial);
  const [quizLink, setQuizLink] = useState(initial.quizLink ?? "");
  const [enabled, setEnabled] = useState(initial.enabled);
  const [accessRule, setAccessRule] = useState<QuizAccessRule>(initial.accessRule);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [message, setMessage] = useState<string | null>(null);

  const dirty = quizLink !== (saved.quizLink ?? "") || enabled !== saved.enabled || accessRule !== saved.accessRule;

  const save = async (next?: Partial<{ enabled: boolean }>) => {
    setSaving(true);
    setError(null);
    setFieldError(undefined);
    setMessage(null);
    const payload = { quizLink: quizLink.trim(), enabled: next?.enabled ?? enabled, accessRule };
    const res = await adminApi.updateQuiz(payload);
    setSaving(false);
    if (res.ok) {
      setSaved(res.data);
      setQuizLink(res.data.quizLink ?? "");
      setEnabled(res.data.enabled);
      setAccessRule(res.data.accessRule);
      setMessage(res.data.enabled ? "Saved — the quiz is enabled." : "Saved — the quiz is disabled.");
    } else {
      setError(res.error.message);
      setFieldError(res.error.fieldErrors?.quizLink);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!saving) void save();
  };

  return (
    <section aria-labelledby="quiz-admin-title" className="rounded-2xl border border-[var(--line-strong)] p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="quiz-admin-title" className="text-xl font-medium text-flare">
            Deja Vu qualification quiz
          </h2>
          <p className="mt-1 text-sm text-mist">
            Currently{" "}
            <strong className={saved.enabled ? "text-emerald-200" : "text-amber-200"}>{saved.enabled ? "ENABLED" : "DISABLED"}</strong>
            {saved.updatedAt && (
              <>
                {" "}
                · last updated {formatDateTime(saved.updatedAt)}
                {saved.updatedBy ? ` by ${saved.updatedBy}` : ""}
              </>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant={saved.enabled ? "danger" : "success"}
          size="sm"
          loading={saving}
          disabled={!saved.enabled && !quizLink.trim()}
          onClick={() => save({ enabled: !saved.enabled })}
        >
          {saved.enabled ? "Disable quiz" : "Enable quiz"}
        </Button>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="quiz-link" className="mb-1 block text-sm text-sand">
            Quiz URL
          </label>
          <input
            id="quiz-link"
            type="url"
            inputMode="url"
            value={quizLink}
            onChange={(e) => setQuizLink(e.target.value)}
            placeholder="https://…"
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "quiz-link-error" : "quiz-link-hint"}
            className="field-input"
          />
          {fieldError ? (
            <p id="quiz-link-error" className="mt-1.5 text-sm text-[#f4a193]">
              {fieldError}
            </p>
          ) : (
            <p id="quiz-link-hint" className="mt-1.5 text-xs text-smoke">
              Leave empty to remove the link. Registrants see “Quiz link will appear here once it is made available.” until a link is set and enabled.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="quiz-rule" className="mb-1 block text-sm text-sand">
            Who can see the link
          </label>
          <select id="quiz-rule" value={accessRule} onChange={(e) => setAccessRule(e.target.value as QuizAccessRule)} className="field-input">
            <option value="AFTER_SUBMISSION">After payment proof is submitted</option>
            <option value="AFTER_VERIFICATION">Only after payment is VERIFIED</option>
          </select>
        </div>
        <label className="flex items-center gap-3 text-sm text-sand">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-4 w-4 accent-[#f5c688]" />
          Quiz enabled
        </label>
        <div className="flex items-center justify-end gap-3">
          {message && (
            <p role="status" className="text-sm text-emerald-200">
              {message}
            </p>
          )}
          <Button type="submit" size="sm" loading={saving} disabled={!dirty}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
      {error && !fieldError && (
        <p role="alert" className="mt-3 text-sm text-[#f4a193]">
          {error}
        </p>
      )}
    </section>
  );
}
