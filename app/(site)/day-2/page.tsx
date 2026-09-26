import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Starfield } from "@/components/visual/Starfield";
import { DAY_2_EVENTS, formatInr, registrationAmountInr } from "@/lib/events/catalog";

export const metadata: Metadata = {
  title: "Day 2 — October 9 · Illuminate Entrepreneurship Workshop",
  description:
    "Day 2 of ILLUMINATE: Illuminate — Entrepreneurship Workshop, an initiative by E-Cell IIT Bombay. Business Model Canvas, Financial Planning, Pitching, Startup Development. ₹799 per person.",
};

export default function DayTwoPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden pb-16 pt-36 sm:pb-24 sm:pt-44">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <Starfield density={0.6} />
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/75 to-void/20" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-void" />
        </div>
        <Container>
          <p className="text-sm text-gold/90 sm:text-base">October 9</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.92] text-flare sm:text-8xl">Day 2</h1>
          <p className="mt-6 max-w-xl text-lg text-sand/85">One event, the flagship of ILLUMINATE.</p>
        </Container>
      </section>

      {DAY_2_EVENTS.map((event) => {
        const topics = event.highlights.find((h) => h.title === "What you'll learn");
        const benefits = event.highlights.find((h) => h.title === "What you receive");
        const amount = registrationAmountInr(event);
        return (
          <article key={event.slug} id={event.slug} aria-labelledby={`${event.slug}-title`} className="pb-28">
            <Container>
              <Reveal className="border-t border-[var(--line)] pt-16">
                <h2 id={`${event.slug}-title`} className="font-display text-6xl leading-[0.95] text-flare sm:text-8xl">
                  Illuminate
                </h2>
                <p className="mt-3 font-display text-3xl font-normal text-gold">Entrepreneurship Workshop</p>
                {event.initiativeBy && (
                  <p className="mt-6 text-sand/85">
                    An initiative by <span className="text-flare">{event.initiativeBy}</span>
                  </p>
                )}
                {event.motto && <p className="mt-2 text-gold/90">{event.motto}</p>}
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sand/85">{event.description}</p>
                {event.notes.length > 0 && (
                  <ul className="mt-8 space-y-2 text-mist">
                    {event.notes.map((note) => (
                      <li key={note} className="flex gap-3">
                        <span aria-hidden="true" className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                        {note}
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>

              <Reveal className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-[var(--line)] lg:grid-cols-[1.4fr_1fr]">
                {topics && (
                  <div className="bg-void p-8 sm:p-12">
                    <h3 className="text-sm text-mist">{topics.title}</h3>
                    <ol className="mt-6 space-y-5">
                      {topics.items.map((item, i) => (
                        <li key={item} className="flex items-baseline gap-5">
                          <span className="font-display text-xl text-smoke">{String(i + 1).padStart(2, "0")}</span>
                          <span className="font-display text-3xl text-flare sm:text-4xl">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="flex flex-col justify-between gap-10 bg-void p-8 sm:p-12">
                  {benefits && (
                    <div>
                      <h3 className="text-sm text-mist">{benefits.title}</h3>
                      <ul className="mt-6 space-y-3 text-xl text-flare">
                        {benefits.items.map((item) => (
                          <li key={item} className="flex items-baseline gap-3">
                            <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 translate-y-[-3px] rounded-full bg-gold" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-mist">Fee</p>
                    <p className="mt-1 font-display text-5xl text-flare">
                      {formatInr(event.feePerPersonInr)}
                      <span className="ml-2 font-sans text-base text-mist">per person</span>
                    </p>
                    <ButtonLink href={event.registerPath} size="lg" className="mt-8 w-full">
                      Register · {formatInr(amount)}
                    </ButtonLink>
                  </div>
                </div>
              </Reveal>
            </Container>
          </article>
        );
      })}
    </>
  );
}
