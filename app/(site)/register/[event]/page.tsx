import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import { RegistrationForm } from "@/components/registration/RegistrationForm";
import { Container } from "@/components/ui/Container";
import { ExclusiveBenefits } from "@/components/ui/ExclusiveBenefits";
import { FeeIncludes } from "@/components/ui/FeeIncludes";
import { registrationClosedMessage } from "@/lib/events/capacity";
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
        {capacity?.full ? (
          <div role="status" className="mt-10 rounded-2xl border border-[var(--line-strong)] bg-night p-6 sm:p-8">
            <h2 className="font-display text-4xl text-flare">Registrations are closed</h2>
            <p className="sr-only">{registrationClosedMessage(event)}</p>
          </div>
        ) : (
          <>
            <p className="mt-4 text-mist">
              {event.format === "TEAM" ? `Team of exactly ${event.teamSize}` : "Individual registration"} · {feeLabel(event)}
            </p>
            {event.registrationNote && (
              <p className="mt-4 max-w-2xl border-l-2 border-gold/60 pl-3 text-sm leading-relaxed text-mist">
                <span className="font-medium text-flare">Note:</span> {event.registrationNote}
              </p>
            )}
            <FeeIncludes event={event} className="mt-6" />
            {event.slug === "illuminate" && <ExclusiveBenefits className="mt-8" />}
            <div className="mt-12">
              <RegistrationForm event={event} payment={getPaymentConfig()} />
            </div>
          </>
        )}
      </Container>
    </section>
  );
}
