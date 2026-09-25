import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ArrowIcon } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { DAY_1_EVENTS, DAY_2_EVENTS, type EventContent } from "@/lib/events/catalog";

export const metadata: Metadata = {
  title: "Schedule",
  description: "ILLUMINATE schedule: October 8 (Day 1) and October 9 (Day 2).",
};

const DAYS: Array<{ day: number; date: string; href: string; events: EventContent[] }> = [
  { day: 1, date: "October 8", href: "/day-1", events: DAY_1_EVENTS },
  { day: 2, date: "October 9", href: "/day-2", events: DAY_2_EVENTS },
];

export default function SchedulePage() {
  return (
    <>
      <PageHero eyebrow="October 8–9" title="Schedule">
        <p>Session timings will be announced by the organisers.</p>
      </PageHero>
      <Container className="pb-28">
        <ol className="relative space-y-20 border-l border-[var(--line-strong)] pl-8 sm:pl-14">
          {DAYS.map((d, di) => (
            <Reveal as="li" key={d.day} delay={di * 100} className="relative">
              <span aria-hidden="true" className="absolute -left-[37px] top-3 h-3 w-3 rounded-full bg-gold shadow-[0_0_18px_4px_rgb(245_198_136/0.45)] sm:-left-[61px]" />
              <p className="text-sm text-mist">Day {d.day}</p>
              <h2 className="font-display text-5xl text-flare sm:text-6xl">{d.date}</h2>
              <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                {d.events.map((e) => (
                  <li key={e.slug}>
                    <Link href={d.day === 1 ? `${d.href}#${e.slug}` : d.href} className="group flex items-center justify-between gap-6 py-5">
                      <span>
                        <span className="block font-display text-3xl text-flare">{e.name}</span>
                        <span className="text-sm text-mist">{e.format === "TEAM" ? `Team of ${e.teamSize}` : "Individual"}</span>
                      </span>
                      <ArrowIcon className="h-4 w-4 shrink-0 text-mist transition-transform duration-300 group-hover:translate-x-1 group-hover:text-flare" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </Container>
    </>
  );
}
