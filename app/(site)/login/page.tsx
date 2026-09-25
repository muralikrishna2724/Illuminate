import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Container } from "@/components/ui/Container";
import { ADMIN_HOME, PARTICIPANT_HOME } from "@/lib/auth/constants";
import { getCurrentAdmin, getCurrentParticipantEmail } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to see your ILLUMINATE registrations, or to manage the event as an organiser.",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect(ADMIN_HOME);
  if (await getCurrentParticipantEmail()) redirect(PARTICIPANT_HOME);

  return (
    <section className="pb-28 pt-36 sm:pt-44">
      <Container size="compact">
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-5xl text-flare sm:text-6xl">Log in</h1>
          <p className="mt-4 text-mist">
            Registered for an event? Use the email you registered with and your registration ID. Organisers use their email and
            password.
          </p>
          <div className="mt-10 rounded-2xl border border-[var(--line-strong)] bg-white/[0.02] p-6 sm:p-8">
            <LoginForm />
          </div>
          <p className="mt-8 text-sm text-mist">
            Not registered yet?{" "}
            <Link href="/register" className="text-flare underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
              Register for an event
            </Link>
            .
          </p>
        </div>
      </Container>
    </section>
  );
}
