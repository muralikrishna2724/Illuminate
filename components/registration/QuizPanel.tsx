import Link from "next/link";
import type { QuizAccess } from "@/types/domain";
import { CopyableId } from "./CopyableId";

/**
 * Deja Vu Phase 1 — the online qualification quiz, unlocked by the organisers' access rule.
 * `quizId` is only passed on the signed-in dashboard.
 */
export function QuizPanel({ quiz, quizId }: { quiz: QuizAccess; quizId?: string | null }) {
  return (
    <section aria-labelledby="quiz-title" className="rounded-2xl border border-[var(--line-strong)] p-6 sm:p-8">
      <p className="text-sm text-gold/90">Deja Vu Hackathon · Phase 1</p>
      <h2 id="quiz-title" className="mt-1 font-display text-3xl text-flare">
        Qualification quiz
      </h2>
      {quiz.state === "available" && (
        <>
          <p className="mt-3 text-mist">
            Your payment is verified and the qualification quiz is open. Teams shortlisted from the quiz go on to the offline hackathon.
          </p>
          {quizId === undefined && (
            <p className="mt-3 text-sm text-mist">
              You&apos;ll need your team&apos;s quiz ID to start.{" "}
              <Link href="/login" className="text-flare underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
                Log in to your dashboard
              </Link>{" "}
              to see and copy it.
            </p>
          )}
          {quizId && (
            <div className="mt-5">
              <CopyableId label="Your team's quiz ID" value={quizId} />
              <p className="mt-2 text-sm text-mist">
                Enter this ID on the quiz page to start. Keep it within your team: anyone with it can take the quiz as your team.
              </p>
            </div>
          )}
          <a
            href={quiz.quizLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-flare px-6 font-medium text-void transition-colors hover:bg-gold"
          >
            Open the quiz
            <span className="sr-only">(opens in a new tab)</span>
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M6 3h7v7M13 3 4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </>
      )}
      {quiz.state === "not_available" && <p className="mt-3 text-mist">Quiz link will appear here once it is made available.</p>}
      {quiz.state === "awaiting_verification" && (
        <p className="mt-3 text-mist">
          The quiz link will appear here once the organisers verify your payment. Teams shortlisted from the quiz go on to the offline hackathon.
        </p>
      )}
      {quiz.state === "payment_rejected" && (
        <p className="mt-3 text-mist">The quiz is not available because the payment for this registration was rejected.</p>
      )}
    </section>
  );
}
