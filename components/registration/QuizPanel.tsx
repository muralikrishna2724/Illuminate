import type { QuizAccess } from "@/types/domain";

/** Deja Vu qualification quiz section, shown after payment proof is submitted. */
export function QuizPanel({ quiz }: { quiz: QuizAccess }) {
  return (
    <section aria-labelledby="quiz-title" className="rounded-2xl border border-[var(--line-strong)] p-6 sm:p-8">
      <p className="text-sm text-gold/90">Deja Vu Hackathon</p>
      <h2 id="quiz-title" className="mt-1 font-display text-3xl text-flare">
        Qualification quiz
      </h2>
      {quiz.state === "available" && (
        <>
          <p className="mt-3 text-mist">The qualification quiz is open. Use the link below.</p>
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
        <p className="mt-3 text-mist">The quiz link will appear here once your payment has been verified by the organisers.</p>
      )}
      {quiz.state === "payment_rejected" && (
        <p className="mt-3 text-mist">The quiz is not available because the payment for this registration was rejected.</p>
      )}
    </section>
  );
}
