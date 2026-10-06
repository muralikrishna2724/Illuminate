import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { Container } from "@/components/ui/Container";
import { ExclusiveBenefits } from "@/components/ui/ExclusiveBenefits";
import { FeeIncludes } from "@/components/ui/FeeIncludes";
import { spotsFilledMessage } from "@/lib/events/capacity";
import { EVENTS, feeLabel } from "@/lib/events/catalog";
import { getPaymentConfig } from "@/lib/site-config";
import { getEventCapacities } from "@/services/event-service";
import { EVENT_SLUGS, isEventSlug } from "@/types/domain";

export const dynamicParams = false;

export function generateStaticParams() {
  return EVENT_SLUGS.map((event) => ({ event }));
}

export async function generateMetadata({ params }: PageProps<"/register/[event]">): Promise<Metadata> {
  const { event } = await params;
  if (!isEventSlug(event)) return {};
  return { title: `Register — ${EVENTS[event].name}`, description: `Register for ${EVENTS[event].name} at INNOVENTRA. ${feeLabel(EVENTS[event])}.` };
}

export default async function RegisterEventPage({ params }: PageProps<"/register/[event]">) {
  const { event: slug } = await params;
  if (!isEventSlug(slug)) notFound();
  // Render per request so payment details configured via environment variables apply without a rebuild.
  await connection();
  const event = EVENTS[slug];
  const capacity = (await getEventCapacities())[slug];

  return (
    <section className="relative isolate pb-28 pt-32 sm:pt-40">
      <Container size="narrow">
        <Link href="/register" className="text-sm text-mist hover:text-flare">
          ← All events
        </Link>
        <p className={`mt-8 text-sm ${event.day === 2 ? "text-gold/90" : "text-mist"}`}>
          Day {event.day} · {event.dateLabel}
        </p>
        <h1 className="mt-2 font-display text-[2.6rem] leading-[0.95] text-flare [overflow-wrap:anywhere] min-[400px]:text-5xl sm:text-7xl">{event.name}</h1>
        <p className="mt-4 text-mist">
          {event.format === "TEAM" ? `Team of exactly ${event.teamSize}` : "Individual registration"} · {feeLabel(event)}
        </p>
        <FeeIncludes event={event} className="mt-6" />
        {event.slug === "illuminate" && <ExclusiveBenefits className="mt-8" />}
        <div className="mt-12">
          {capacity?.full && capacity.cap !== null ? (
            <div role="status" className="rounded-2xl border border-bad/50 bg-bad/10 p-6 sm:p-8">
              <h2 className="font-display text-4xl text-flare">Registration limit reached</h2>
              <p className="mt-3 text-sand/85">{spotsFilledMessage(event, capacity.cap)}</p>
              <p className="mt-3 text-sm text-mist">Please don&apos;t make a payment for this event.</p>
            </div>
          ) : (
            <RegistrationForm event={event} payment={getPaymentConfig()} />
          )}
        </div>
      </Container>
    </section>
  );
}
