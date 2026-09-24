"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { submitRegistration } from "@/lib/api/registrations";
import { formatInr, registrationAmountInr, type EventContent } from "@/lib/events/catalog";
import type { PaymentConfig } from "@/lib/site-config";
import { SCREENSHOT_REQUIRED_MESSAGE, validateScreenshotClientSide } from "@/lib/validation/file";
import {
  individualRegistrationSchema,
  paymentProofSchema,
  TEAM_SIZE,
  teamRegistrationSchema,
  toFieldErrors,
  YEAR_OPTIONS,
  type IndividualRegistrationInput,
  type TeamMemberInput,
  type TeamRegistrationInput,
} from "@/lib/validation/registration";
import type { RegistrationCreated } from "@/types/domain";
import { SelectField, TextField } from "./fields";
import { PaymentInstructions } from "./PaymentInstructions";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { ScreenshotUpload } from "./ScreenshotUpload";

type Step = "details" | "payment" | "done";
type Errors = Record<string, string>;

const emptyMember = (): TeamMemberInput => ({ name: "", email: "", phone: "", department: "", year: "" as TeamMemberInput["year"] });

const emptyTeam = (): TeamRegistrationInput => ({
  teamName: "",
  college: "",
  leaderName: "",
  leaderEmail: "",
  leaderPhone: "",
  members: Array.from({ length: TEAM_SIZE }, emptyMember),
});

const emptyIndividual = (): IndividualRegistrationInput => ({
  fullName: "",
  email: "",
  phone: "",
  college: "",
  department: "",
  year: "" as IndividualRegistrationInput["year"],
});

const PAYMENT_FIELDS = new Set(["utr", "screenshot"]);

export function RegistrationForm({ event, payment }: { event: EventContent; payment: PaymentConfig }) {
  const isTeam = event.format === "TEAM";
  const amount = registrationAmountInr(event);
  const breakdown = isTeam
    ? `${formatInr(event.feePerPersonInr)} × ${event.teamSize} members`
    : `${formatInr(event.feePerPersonInr)} per person`;

  const [step, setStep] = useState<Step>("details");
  const [team, setTeam] = useState<TeamRegistrationInput>(emptyTeam);
  const [individual, setIndividual] = useState<IndividualRegistrationInput>(emptyIndividual);
  const [utr, setUtr] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<RegistrationCreated | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousStep = useRef<Step>(step);

  // Move focus to the step heading on step change (keyboard & screen-reader friendly).
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const focusFirstError = (errs: Errors) => {
    requestAnimationFrame(() => {
      const first = Object.keys(errs)[0];
      if (!first || !formRef.current) return;
      const el = formRef.current.querySelector<HTMLElement>(`[name="${CSS.escape(first)}"]`) ?? formRef.current.querySelector<HTMLElement>("[aria-invalid='true']");
      el?.focus();
    });
  };

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors(({ [key]: _removed, ...rest }) => rest);
    }
  };

  const details = isTeam ? team : individual;

  const validateDetails = (): Errors => {
    const parsed = isTeam ? teamRegistrationSchema.safeParse(team) : individualRegistrationSchema.safeParse(individual);
    return parsed.success ? {} : toFieldErrors(parsed.error);
  };

  const goToPayment = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateDetails();
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) {
      setFormError("Please check the highlighted fields.");
      focusFirstError(errs);
      return;
    }
    setStep("payment");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errs: Errors = {};
    const utrParsed = paymentProofSchema.safeParse({ utr });
    if (!utrParsed.success) Object.assign(errs, toFieldErrors(utrParsed.error));
    if (!screenshot) errs.screenshot = SCREENSHOT_REQUIRED_MESSAGE;
    else {
      const problem = validateScreenshotClientSide(screenshot);
      if (problem) errs.screenshot = problem;
    }
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length || !screenshot) {
      setFormError("Please check the highlighted fields.");
      focusFirstError(errs);
      return;
    }

    setSubmitting(true);
    setProgress(0);
    const response = await submitRegistration({ event: event.slug, details, utr, screenshot }, setProgress);
    setSubmitting(false);
    setProgress(null);

    if (response.ok) {
      setResult(response.data);
      setStep("done");
      return;
    }

    const serverErrors = response.error.fieldErrors ?? {};
    setErrors(serverErrors);
    setFormError(response.error.message);
    const detailErrorKeys = Object.keys(serverErrors).filter((k) => !PAYMENT_FIELDS.has(k));
    if (detailErrorKeys.length) {
      setStep("details");
    } else {
      focusFirstError(serverErrors);
    }
  };

  if (step === "done" && result) {
    return <RegistrationSuccess result={result} headingRef={headingRef} />;
  }

  const updateMember = (index: number, key: keyof TeamMemberInput, value: string) => {
    setTeam((t) => ({ ...t, members: t.members.map((m, i) => (i === index ? { ...m, [key]: value } : m)) }));
    clearError(`members.${index}.${key}`);
  };

  const copyLeaderToFirstMember = () => {
    setTeam((t) => ({
      ...t,
      members: t.members.map((m, i) => (i === 0 ? { ...m, name: t.leaderName, email: t.leaderEmail, phone: t.leaderPhone } : m)),
    }));
    ["name", "email", "phone"].forEach((k) => clearError(`members.0.${k}`));
  };

  return (
    <div>
      <Stepper step={step} />

      <form ref={formRef} noValidate onSubmit={step === "details" ? goToPayment : submit} className="mt-10" aria-busy={submitting}>
        <h2 ref={headingRef} tabIndex={-1} className="scroll-mt-28 font-display text-4xl text-flare outline-none">
          {step === "details" ? (isTeam ? "Team details" : "Your details") : "Payment"}
        </h2>

        {formError && (
          <div role="alert" className="mt-6 rounded-xl border border-[#f08b7a]/50 bg-[#f08b7a]/10 px-4 py-3 text-sm text-[#f7b3a7]">
            {formError}
          </div>
        )}

        {step === "details" && isTeam && (
          <div className="mt-8 space-y-12">
            <fieldset className="grid gap-5 sm:grid-cols-2">
              <legend className="sr-only">Team</legend>
              <TextField id="teamName" label="Team name" autoComplete="off" value={team.teamName} error={errors.teamName}
                onChange={(e) => { setTeam({ ...team, teamName: e.target.value }); clearError("teamName"); }} />
              <TextField id="college" label="College" autoComplete="organization" value={team.college} error={errors.college}
                onChange={(e) => { setTeam({ ...team, college: e.target.value }); clearError("college"); }} />
            </fieldset>

            <fieldset>
              <legend className="text-lg text-flare">Team leader</legend>
              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <TextField id="leaderName" label="Name" autoComplete="name" value={team.leaderName} error={errors.leaderName}
                  onChange={(e) => { setTeam({ ...team, leaderName: e.target.value }); clearError("leaderName"); }} />
                <TextField id="leaderEmail" label="Email" type="email" autoComplete="email" inputMode="email" value={team.leaderEmail} error={errors.leaderEmail}
                  onChange={(e) => { setTeam({ ...team, leaderEmail: e.target.value }); clearError("leaderEmail"); }} />
                <TextField id="leaderPhone" label="Phone" type="tel" autoComplete="tel" inputMode="tel" value={team.leaderPhone} error={errors.leaderPhone}
                  hint="10-digit mobile number"
                  onChange={(e) => { setTeam({ ...team, leaderPhone: e.target.value }); clearError("leaderPhone"); }} />
              </div>
            </fieldset>

            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg text-flare">Members ({TEAM_SIZE} required)</h3>
                <p className="text-sm text-mist">The team leader is one of the {TEAM_SIZE} members.</p>
              </div>
              {errors.members && <p role="alert" className="mt-2 text-sm text-[#f4a193]">{errors.members}</p>}
              <div className="mt-6 space-y-8">
                {team.members.map((member, i) => (
                  <fieldset key={i} className="rounded-2xl border border-[var(--line)] p-5 sm:p-6">
                    <legend className="px-2 text-sm text-gold/90">Member {i + 1}{i === 0 ? " · team leader" : ""}</legend>
                    {i === 0 && (
                      <button type="button" onClick={copyLeaderToFirstMember} className="mb-4 text-sm text-mist underline decoration-gold/40 underline-offset-4 hover:text-flare">
                        Copy team leader details
                      </button>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      <TextField id={`members.${i}.name`} label="Name" autoComplete="off" value={member.name} error={errors[`members.${i}.name`]}
                        onChange={(e) => updateMember(i, "name", e.target.value)} />
                      <TextField id={`members.${i}.email`} label="Email" type="email" inputMode="email" autoComplete="off" value={member.email} error={errors[`members.${i}.email`]}
                        onChange={(e) => updateMember(i, "email", e.target.value)} />
                      <TextField id={`members.${i}.phone`} label="Phone" type="tel" inputMode="tel" autoComplete="off" value={member.phone} error={errors[`members.${i}.phone`]}
                        onChange={(e) => updateMember(i, "phone", e.target.value)} />
                      <TextField id={`members.${i}.department`} label="Department" autoComplete="off" value={member.department} error={errors[`members.${i}.department`]}
                        onChange={(e) => updateMember(i, "department", e.target.value)} />
                      <SelectField id={`members.${i}.year`} label="Year" options={YEAR_OPTIONS} value={member.year} error={errors[`members.${i}.year`]}
                        onChange={(e) => updateMember(i, "year", e.target.value)} />
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "details" && !isTeam && (
          <fieldset className="mt-8 grid gap-5 sm:grid-cols-2">
            <legend className="sr-only">Participant</legend>
            <TextField id="fullName" label="Full name" autoComplete="name" value={individual.fullName} error={errors.fullName}
              onChange={(e) => { setIndividual({ ...individual, fullName: e.target.value }); clearError("fullName"); }} />
            <TextField id="email" label="Email" type="email" inputMode="email" autoComplete="email" value={individual.email} error={errors.email}
              onChange={(e) => { setIndividual({ ...individual, email: e.target.value }); clearError("email"); }} />
            <TextField id="phone" label="Phone" type="tel" inputMode="tel" autoComplete="tel" value={individual.phone} error={errors.phone}
              hint="10-digit mobile number"
              onChange={(e) => { setIndividual({ ...individual, phone: e.target.value }); clearError("phone"); }} />
            <TextField id="college" label="College" autoComplete="organization" value={individual.college} error={errors.college}
              onChange={(e) => { setIndividual({ ...individual, college: e.target.value }); clearError("college"); }} />
            <TextField id="department" label="Department" autoComplete="off" value={individual.department} error={errors.department}
              onChange={(e) => { setIndividual({ ...individual, department: e.target.value }); clearError("department"); }} />
            <SelectField id="year" label="Year" options={YEAR_OPTIONS} value={individual.year} error={errors.year}
              onChange={(e) => { setIndividual({ ...individual, year: e.target.value as IndividualRegistrationInput["year"] }); clearError("year"); }} />
          </fieldset>
        )}

        {step === "payment" && (
          <div className="mt-8 space-y-8">
            <PaymentInstructions amountInr={amount} breakdown={breakdown} payment={payment} />
            <div className="grid gap-8">
              <TextField
                id="utr"
                label="UTR / Transaction ID"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                value={utr}
                error={errors.utr}
                disabled={submitting}
                hint="Find it in your UPI app under the payment details (usually 12 digits)."
                onChange={(e) => { setUtr(e.target.value); clearError("utr"); }}
              />
              <ScreenshotUpload
                file={screenshot}
                onChange={setScreenshot}
                error={errors.screenshot}
                onError={(message) => setErrors(({ screenshot: _s, ...rest }) => (message ? { ...rest, screenshot: message } : rest))}
                disabled={submitting}
                progress={progress}
              />
            </div>
            <p className="text-sm text-mist">
              Submitting sends your payment proof for manual verification. Your payment is not confirmed until the organisers verify it.
            </p>
          </div>
        )}

        <div className="mt-12 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center sm:justify-between">
          {step === "payment" ? (
            <Button type="button" variant="ghost" onClick={() => { setStep("details"); setFormError(null); }} disabled={submitting}>
              ← Back to details
            </Button>
          ) : (
            <Link href="/register" className="px-2 text-sm text-mist hover:text-flare">
              ← Choose a different event
            </Link>
          )}
          {step === "details" ? (
            <Button type="submit" size="lg">
              Continue to payment · {formatInr(amount)}
            </Button>
          ) : (
            <Button type="submit" size="lg" loading={submitting}>
              {submitting ? "Submitting…" : "Submit payment proof"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: Array<{ key: Step; label: string }> = [
    { key: "details", label: "Details" },
    { key: "payment", label: "Payment proof" },
    { key: "done", label: "Confirmation" },
  ];
  const current = steps.findIndex((s) => s.key === step);
  return (
    <ol aria-label="Registration progress" className="flex items-center gap-3 text-sm">
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-3" aria-current={i === current ? "step" : undefined}>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
              i < current ? "border-gold bg-gold text-void" : i === current ? "border-gold text-flare" : "border-[var(--line-strong)] text-smoke"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </span>
          <span className={i === current ? "text-flare" : "hidden text-smoke sm:inline"}>{s.label}</span>
          {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-6 bg-[var(--line-strong)] sm:w-10" />}
        </li>
      ))}
    </ol>
  );
}
