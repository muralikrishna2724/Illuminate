import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { QuizPanel } from "@/components/registration/QuizPanel";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { requireParticipantPage } from "@/lib/auth/guards";
import { formatInr } from "@/lib/events/catalog";
import { getParticipantRegistrations } from "@/services/participant-service";

export const metadata: Metadata = { title: "My registrations", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUS_COPY = {
  PENDING: "Payment proof submitted — awaiting verification by the organisers.",
  VERIFIED: "Payment verified. You're registered.",
  REJECTED: "Payment could not be verified. Please contact the organisers.",
} as const;

const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function ParticipantDashboardPage() {
  const email = await requireParticipantPage();
  const registrations = await getParticipantRegistrations(email);

  return (
    <section className="pb-28 pt-36 sm:pt-44">
      <Container size="narrow">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-mist">Signed in as {email}</p>
            <h1 className="mt-2 font-display text-5xl text-flare sm:text-6xl">My registrations</h1>
          </div>
          <LogoutButton className="border border-[var(--line-strong)]" />
        </div>

        {registrations.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-[var(--line-strong)] p-8">
            <p className="text-sand">No registrations are linked to this email yet.</p>
            <ButtonLink href="/register" className="mt-6">
              Register for an event
            </ButtonLink>
          </div>
        ) : (
          <ul className="mt-12 space-y-8">
            {registrations.map((r) => (
              <li key={r.registrationId} className="space-y-4">
                <article className="rounded-2xl border border-[var(--line-strong)] bg-white/[0.02] p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gold">
                        Day {r.event.day} · {r.event.day === 1 ? "October 8" : "October 9"}
                      </p>
                      <h2 className="mt-1 font-display text-3xl text-flare">{r.event.name}</h2>
                    </div>
                    <StatusBadge status={r.paymentStatus} className="text-sm" />
                  </div>

                  <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-mist">Registration ID</dt>
                      <dd className="mt-1 select-all text-lg font-semibold tracking-wide text-flare tabular-nums">{r.registrationId}</dd>
                    </div>
                    <div>
                      <dt className="text-mist">Amount</dt>
                      <dd className="mt-1 text-lg text-flare">{formatInr(r.amountInr)}</dd>
                    </div>
                    <div>
                      <dt className="text-mist">Submitted</dt>
                      <dd className="mt-1 text-flare">{dateFormat.format(new Date(r.submittedAt))}</dd>
                    </div>
                  </dl>

                  {r.team && (
                    <div className="mt-6 text-sm">
                      <p className="text-mist">Team</p>
                      <p className="mt-1 text-flare">{r.team.name}</p>
                      <p className="mt-1 text-sand/80">{r.team.members.join(" · ")}</p>
                    </div>
                  )}

                  <p className="mt-6 text-sand">{STATUS_COPY[r.paymentStatus]}</p>
                  {r.rejectionReason && <p className="mt-1 text-mist">Reason: {r.rejectionReason}</p>}
                </article>
                {r.quiz && <QuizPanel quiz={r.quiz} />}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-12 text-sm text-mist">
          Want to join another event?{" "}
          <Link href="/register" className="text-flare underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
            Register here
          </Link>
          .
        </p>
      </Container>
    </section>
  );
}
