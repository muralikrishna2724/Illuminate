"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-5xl text-flare">Something went wrong</h1>
      <p className="mt-4 text-mist">Something went wrong. Please try again.</p>
      <button type="button" onClick={reset} className="mt-8 inline-flex h-11 items-center rounded-full bg-flare px-6 font-medium text-void hover:bg-gold">
        Try again
      </button>
    </main>
  );
}
