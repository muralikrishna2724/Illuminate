"use client";

import Link from "next/link";
import { useState, type RefObject } from "react";
import { formatInr } from "@/lib/events/catalog";
import type { RegistrationCreated } from "@/types/domain";
import { QuizPanel } from "./QuizPanel";
import { StatusBadge } from "./StatusBadge";

export function RegistrationSuccess({
  result,
  headingRef,
}: {
  result: RegistrationCreated;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.registrationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (insecure context); the ID is selectable anyway.
    }
  };

  return (
    <div className="space-y-8">
      <div role="status" className="rounded-3xl border border-[var(--line-strong)] bg-white/[0.02] p-6 sm:p-10">
        <p className="text-sm text-gold/90">{result.eventName}</p>
        <h2 ref={headingRef} tabIndex={-1} className="mt-2 scroll-mt-28 font-display text-5xl text-flare outline-none sm:text-6xl">
          Registration Successful
        </h2>

        <dl className="mt-10 grid gap-8 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <dt className="text-sm text-mist">Registration ID</dt>
            <dd className="mt-2 flex flex-wrap items-center gap-3">
              <span className="select-all text-4xl font-semibold tracking-wide text-flare tabular-nums sm:text-5xl">{result.registrationId}</span>
              <button
                type="button"
                onClick={copy}
                className="rounded-full border border-[var(--line-strong)] px-4 py-1.5 text-sm text-sand hover:border-gold/60 hover:text-flare"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </dd>
            <p className="mt-2 text-sm text-mist">Save this ID — you will need it to check your status.</p>
          </div>
          <div>
            <dt className="text-sm text-mist">Payment Status</dt>
            <dd className="mt-3">
              <StatusBadge status={result.paymentStatus} className="text-sm" />
            </dd>
            <p className="mt-3 text-sm text-mist">Amount submitted: {formatInr(result.amountInr)}</p>
          </div>
        </dl>

        <div className="divider-glow my-8" />

        <p className="text-lg text-sand">Your payment proof has been submitted and is awaiting verification.</p>
        <p className="mt-2 text-mist">
          The organisers will check your UTR and screenshot against their payment records. Your payment status will change to VERIFIED
          once it has been checked.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/registration/${result.registrationId}`}
            className="inline-flex h-11 items-center rounded-full bg-flare px-6 font-medium text-void transition-colors hover:bg-gold"
          >
            View registration status
          </Link>
          <Link href="/register" className="inline-flex h-11 items-center rounded-full border border-[var(--line-strong)] px-6 text-sand hover:text-flare">
            Register for another event
          </Link>
        </div>
      </div>

      {result.quiz && <QuizPanel quiz={result.quiz} />}
    </div>
  );
}
