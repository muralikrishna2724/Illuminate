import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ArrowIcon } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { EVENT_LIST, feeLabel, formatInr, registrationAmountInr } from "@/lib/events/catalog";

export const metadata: Metadata = {
  title: "Register",
  description: "Register for the Deja Vu Hackathon, AI Debate, IPL Auction or the Illuminate Entrepreneurship Workshop.",
};

export default function RegisterIndexPage() {
  return (
    <>
      <PageHero eyebrow="Step 1 of 3 · Choose an event" title="Register">
        <p>Select the event you want to register for. Each event is registered and paid for separately.</p>
      </PageHero>
      <Container className="pb-28">
        <Reveal as="ul" className="grid gap-px overflow-hidden rounded-3xl bg-[var(--line)] md:grid-cols-2">
          {EVENT_LIST.map((event) => (
            <li key={event.slug} className="bg-void">
              <Link href={event.registerPath} className="group flex h-full flex-col justify-between gap-10 p-8 transition-colors hover:bg-dusk sm:p-10">
                <div>
                  <p className={`text-sm ${event.day === 2 ? "text-gold/90" : "text-mist"}`}>
                    Day {event.day} · {event.dateLabel}
                    {event.day === 2 ? " · Flagship" : ""}
                  </p>
                  <h2 className="mt-3 font-display text-4xl text-flare">{event.name}</h2>
                  <p className="mt-3 text-mist">
                    {event.format === "TEAM" ? `Team of exactly ${event.teamSize}` : "Individual"} · {feeLabel(event)}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-flare">
                  Register · {formatInr(registrationAmountInr(event))}
                  <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </Reveal>
        <p className="mt-10 text-sm text-mist">
          Already registered?{" "}
          <Link href="/registration" className="text-flare underline decoration-gold/50 underline-offset-4">
            Check your registration status
          </Link>
          .
        </p>
      </Container>
    </>
  );
}
