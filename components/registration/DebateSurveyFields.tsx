"use client";

import { DEBATE_SURVEY_QUESTIONS, SURVEY_TOPIC_MAX } from "@/lib/events/debate-survey";

export type SurveyState = Record<string, string>;

/** The Mind x Machine AI survey: five quick multiple-choice questions and one optional line. */
export function DebateSurveyFields({
  value,
  errors,
  onChange,
}: {
  value: SurveyState;
  errors: Record<string, string>;
  onChange: (id: string, answer: string) => void;
}) {
  return (
    <section aria-labelledby="survey-title" className="mt-12 rounded-2xl border border-[var(--line-strong)] p-5 sm:p-7">
      <h3 id="survey-title" className="font-display text-2xl text-flare">
        A quick AI survey
      </h3>
      <p className="mt-1 text-sm text-mist">
        Mind x Machine is about the real-world impact of AI. These questions help us shape the debate. It takes under a minute.
      </p>

      <ol className="mt-6 space-y-8">
        {DEBATE_SURVEY_QUESTIONS.map((q, i) => {
          const errorKey = `survey.${q.id}`;
          const error = errors[errorKey] ?? (i === 0 ? errors.survey : undefined);
          return (
            <li key={q.id}>
              <fieldset aria-describedby={error ? `${errorKey}-error` : undefined}>
                <legend className="flex gap-3 text-flare">
                  <span className="text-smoke">{String(i + 1).padStart(2, "0")}</span>
                  <span>{q.prompt}</span>
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o) => {
                    const checked = value[q.id] === o.value;
                    return (
                      <label
                        key={o.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${
                          checked ? "border-gold bg-powder/40 text-flare" : "border-[var(--line-strong)] text-sand hover:border-gold/60"
                        } ${error && !checked ? "border-bad/60" : ""}`}
                      >
                        <input
                          type="radio"
                          name={errorKey}
                          value={o.value}
                          checked={checked}
                          onChange={() => onChange(q.id, o.value)}
                          required
                          className="h-4 w-4 shrink-0 accent-[var(--color-gold)]"
                        />
                        {o.label}
                      </label>
                    );
                  })}
                </div>
                {error && (
                  <p id={`${errorKey}-error`} role="alert" className="mt-2 text-sm text-bad">
                    {error}
                  </p>
                )}
              </fieldset>
            </li>
          );
        })}
        <li>
          <label htmlFor="survey.topic" className="flex gap-3 text-flare">
            <span className="text-smoke">{String(DEBATE_SURVEY_QUESTIONS.length + 1).padStart(2, "0")}</span>
            <span>
              One real-world impact of AI you&apos;d like to debate <span className="text-mist">(optional)</span>
            </span>
          </label>
          <textarea
            id="survey.topic"
            name="survey.topic"
            rows={2}
            maxLength={SURVEY_TOPIC_MAX}
            value={value.topic ?? ""}
            onChange={(e) => onChange("topic", e.target.value)}
            aria-invalid={errors["survey.topic"] ? true : undefined}
            placeholder="e.g. Should AI-generated art be allowed in competitions?"
            className="field-input mt-3 min-h-20 resize-y"
          />
          {errors["survey.topic"] && <p className="mt-2 text-sm text-bad">{errors["survey.topic"]}</p>}
        </li>
      </ol>
    </section>
  );
}
