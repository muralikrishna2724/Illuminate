import type { Metadata } from "next";
import { EventDetail } from "@/components/home/EventDetail";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/Container";
import { DAY_1_EVENTS } from "@/lib/events/catalog";

export const metadata: Metadata = {
  title: "Day 1 — October 8",
  description: "Day 1 of ILLUMINATE: Deja Vu Hackathon, Under the Hood of AI and IPL Auction.",
};

export default function DayOnePage() {
  return (
    <>
      <PageHero eyebrow="October 8" title="Day 1">
        <p>Three events: the Deja Vu Hackathon, Under the Hood of AI and IPL Auction.</p>
        <nav aria-label="Day 1 events" className="mt-6 flex flex-wrap gap-2 text-base">
          {DAY_1_EVENTS.map((e) => (
            <a
              key={e.slug}
              href={`#${e.slug}`}
              className="rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm text-sand transition-colors hover:border-gold/60 hover:text-flare"
            >
              {e.name}
            </a>
          ))}
        </nav>
      </PageHero>
      <Container className="pb-24">
        {DAY_1_EVENTS.map((event, i) => (
          <EventDetail key={event.slug} event={event} index={i + 1} />
        ))}
      </Container>
    </>
  );
}
