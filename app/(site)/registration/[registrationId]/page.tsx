import type { Metadata } from "next";
import Link from "next/link";
import { QuizPanel } from "@/components/registration/QuizPanel";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { StatusLookupForm } from "@/components/registration/StatusLookupForm";
import { Container } from "@/components/ui/Container";
import { BlackHole } from "@/components/visual/BlackHole";
import { formatInr } from "@/lib/events/catalog";
import { AppError } from "@/lib/http/errors";
import { getPublicRegistrationStatus } from "@/services/registration-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Registration status",
  robots: { index: false, follow: false },
};

const STATUS_COPY = {
  PENDING: "Your payment proof has been submitted and is awaiting verification.",
  VERIFIED: "Your payment has been verified by the organisers. You're registered.",
  REJECTED: "Your payment could not be verified. Please contact the organisers.",
} as const;

export default async function RegistrationStatusPage({ params }: PageProps<"/registration/[registrationId]">) {
  const { registrationId } = await params;

  let status: Awaited<ReturnType<typeof getPublicRegistrationStatus>> | null = null;
  try {
    status = await getPublicRegistrationStatus(decodeURIComponent(registrationId));
  } catch (error) {
    if (!(error instanceof AppError && error.status === 404)) throw error;
  }

  return (
    <section className="relative isolate pb-28 pt-32 sm:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute right-[-30%] top-0 -z-10 w-[90vw] max-w-[560px] sm:right-[-8%] sm:w-[45vw]">
        <BlackHole intensity="faint" />
      </div>
      <Container size="tight">
        <Link href="/registration" className="text-sm text-mist hover:text-flare">
          ← Look up another ID
        </Link>

        {!status ? (
          <div className="mt-10">
            <h1 className="font-display text-5xl text-flare">Registration not found</h1>
            <p className="mt-4 text-mist">We couldn&apos;t find a registration with that ID. Please check it and try again.</p>
            <div className="mt-10">
              <StatusLookupForm initialValue={decodeURIComponent(registrationId)} />
            </div>
          </div>
        ) : (
          <div className="mt-10 space-y-8">
            <div className="rounded-3xl border border-[var(--line-strong)] bg-white/[0.02] p-6 sm:p-10">
              <p className="text-sm text-gold/90">
                {status.event.name} · Day {status.event.day}
              </p>
              <h1 className="mt-2 font-display text-5xl tracking-wide text-flare sm:text-6xl">{status.registrationId}</h1>
              <dl className="mt-8 grid gap-6 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-mist">Payment Status</dt>
                  <dd className="mt-2">
                    <StatusBadge status={status.paymentStatus} className="text-sm" />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-mist">Amount</dt>
                  <dd className="mt-2 text-flare">{formatInr(status.amountInr)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-mist">Submitted</dt>
                  <dd className="mt-2 text-flare">
                    {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(
                      new Date(status.submittedAt),
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-8 text-sand">{STATUS_COPY[status.paymentStatus]}</p>
              {status.rejectionReason && <p className="mt-2 text-mist">Reason: {status.rejectionReason}</p>}
            </div>
            {status.quiz && <QuizPanel quiz={status.quiz} />}
          </div>
        )}
      </Container>
    </section>
  );
}
