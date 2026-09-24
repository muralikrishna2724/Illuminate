import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { Container } from "@/components/ui/Container";
import { BlackHole } from "@/components/visual/BlackHole";
import { EVENTS, feeLabel } from "@/lib/events/catalog";
import { getPaymentConfig } from "@/lib/site-config";
import { EVENT_SLUGS, isEventSlug } from "@/types/domain";

export const dynamicParams = false;

export function generateStaticParams() {
  return EVENT_SLUGS.map((event) => ({ event }));
}

export async function generateMetadata({ params }: PageProps<"/register/[event]">): Promise<Metadata> {
  const { event } = await params;
  if (!isEventSlug(event)) return {};
  return { title: `Register — ${EVENTS[event].name}`, description: `Register for ${EVENTS[event].name} at ILLUMINATE. ${feeLabel(EVENTS[event])}.` };
}

export default async function RegisterEventPage({ params }: PageProps<"/register/[event]">) {
  const { event: slug } = await params;
  if (!isEventSlug(slug)) notFound();
  // Render per request so payment details configured via environment variables apply without a rebuild.
  await connection();
  const event = EVENTS[slug];

  return (
    <section className="relative isolate pb-28 pt-32 sm:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute right-[-30%] top-0 -z-10 w-[90vw] max-w-[560px] sm:right-[-8%] sm:w-[45vw]">
        <BlackHole intensity="faint" />
      </div>
      <Container size="narrow">
        <Link href="/register" className="text-sm text-mist hover:text-flare">
          ← All events
        </Link>
        <p className={`mt-8 text-sm ${event.day === 2 ? "text-gold/90" : "text-mist"}`}>
          Day {event.day} · {event.dateLabel}
        </p>
        <h1 className="mt-2 font-display text-5xl leading-[0.95] text-flare sm:text-7xl">{event.name}</h1>
        <p className="mt-4 text-mist">
          {event.format === "TEAM" ? `Team of exactly ${event.teamSize}` : "Individual registration"} · {feeLabel(event)}
        </p>
        <div className="mt-12">
          <RegistrationForm event={event} payment={getPaymentConfig()} />
        </div>
      </Container>
    </section>
  );
}
