import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 text-center">
      <p className="text-sm text-gold/90">404</p>
      <h1 className="mt-3 font-display text-6xl text-flare">Lost past the horizon</h1>
      <p className="mt-4 max-w-md text-mist">This page doesn&apos;t exist. Let&apos;s get you back.</p>
      <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-flare px-6 font-medium text-void hover:bg-gold">
        Back to home
      </Link>
    </main>
  );
}
