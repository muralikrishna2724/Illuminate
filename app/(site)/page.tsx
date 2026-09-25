import Link from "next/link";
import { EventRow } from "@/components/home/EventRow";
import { Hero } from "@/components/home/Hero";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { Container, Eyebrow } from "@/components/ui/Container";
import { FaqList } from "@/components/ui/FaqList";
import { Reveal } from "@/components/ui/Reveal";
import { BlackHole } from "@/components/visual/BlackHole";
import { DAY_1_EVENTS, EVENTS, EVENT_LIST, formatInr, registrationAmountInr } from "@/lib/events/catalog";
import { FAQS } from "@/lib/faq";

const workshop = EVENTS.illuminate;

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* 2-day overview */}
      <section aria-labelledby="overview-title" className="py-24 sm:py-32">
        <Container>
          <Reveal>
            <Eyebrow>Two days</Eyebrow>
            <h2 id="overview-title" className="mt-3 max-w-3xl font-display text-5xl leading-[1.02] text-flare sm:text-6xl">
              Three events to open. <span className="text-gold">One workshop</span> at the centre.
            </h2>
          </Reveal>

          <Reveal delay={100} className="mt-16 grid gap-px overflow-hidden rounded-3xl bg-[var(--line)] md:grid-cols-2">
            <div className="bg-void p-8 sm:p-10">
              <p className="text-sm text-mist">Day 1 · October 8</p>
              <ul className="mt-6 space-y-3 font-display text-3xl text-flare">
                {DAY_1_EVENTS.map((e) => (
                  <li key={e.slug}>{e.name}</li>
                ))}
              </ul>
              <Link href="/day-1" className="mt-10 inline-flex items-center gap-2 text-sm text-sand hover:text-flare">
                See Day 1 <ArrowIcon />
              </Link>
            </div>
            <div className="relative overflow-hidden bg-void p-8 sm:p-10">
              <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 w-80 opacity-60">
                <BlackHole intensity="faint" />
              </div>
              <p className="relative text-sm text-gold/90">Day 2 · October 9 · Flagship</p>
              <p className="relative mt-6 font-display text-3xl text-flare">{workshop.name}</p>
              <p className="relative mt-3 max-w-sm text-mist">Associated with {workshop.associatedWith}.</p>
              <Link href="/day-2" className="relative mt-10 inline-flex items-center gap-2 text-sm text-sand hover:text-flare">
                See Day 2 <ArrowIcon />
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Day 1 events */}
      <section aria-labelledby="day1-title" className="pb-24 sm:pb-32">
        <Container>
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>Day 1 · October 8</Eyebrow>
              <h2 id="day1-title" className="mt-3 font-display text-5xl text-flare sm:text-6xl">
                Day 1 events
              </h2>
            </div>
            <ButtonLink href="/day-1" variant="secondary">
              Explore Day 1
            </ButtonLink>
          </Reveal>
          <Reveal delay={100}>
            <ol className="mt-12">
              {DAY_1_EVENTS.map((event, i) => (
                <EventRow key={event.slug} event={event} index={i + 1} href={`/day-1#${event.slug}`} />
              ))}
            </ol>
          </Reveal>
        </Container>
      </section>

      {/* Illuminate workshop feature */}
      <section aria-labelledby="workshop-title" className="relative isolate overflow-hidden py-28 sm:py-40">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 w-[140vw] max-w-[900px] -translate-x-1/2 -translate-y-1/2 md:left-[72%] md:w-[70vw]">
            <BlackHole intensity="subtle" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/30 md:via-void/70" />
        </div>
        <Container>
          <Reveal className="max-w-2xl">
            <Eyebrow>Day 2 · October 9 · The flagship</Eyebrow>
            <h2 id="workshop-title" className="mt-4 font-display text-6xl leading-[0.95] text-flare sm:text-8xl">
              Illuminate
            </h2>
            <p className="mt-3 font-display text-2xl font-normal text-gold sm:text-3xl">Entrepreneurship Workshop</p>
            <p className="mt-8 text-lg leading-relaxed text-sand/90">{workshop.description}</p>
          </Reveal>

          <div className="mt-14 grid max-w-3xl gap-12 sm:grid-cols-2">
            {workshop.highlights.map((group, i) => (
              <Reveal key={group.title} delay={i * 120}>
                <h3 className="text-sm text-mist">{group.title}</h3>
                <ul className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-baseline gap-3 text-xl text-flare">
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 translate-y-[-3px] rounded-full bg-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="mt-14 flex flex-wrap items-center gap-6">
            <ButtonLink href="/register/illuminate" size="lg">
              Register for Illuminate · {formatInr(registrationAmountInr(workshop))}
            </ButtonLink>
            <Link href="/day-2" className="inline-flex items-center gap-2 text-sand hover:text-flare">
              Explore the workshop <ArrowIcon />
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* Event navigation */}
      <section aria-labelledby="nav-title" className="py-24 sm:py-28">
        <Container>
          <Reveal>
            <h2 id="nav-title" className="sr-only">
              Find your way
            </h2>
            <nav aria-label="Event sections" className="grid gap-px overflow-hidden rounded-3xl bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {[
                { href: "/day-1", label: "Day 1", sub: "October 8 · three events" },
                { href: "/day-2", label: "Day 2", sub: "October 9 · Illuminate Workshop" },
                { href: "/schedule", label: "Schedule", sub: "Both days at a glance" },
                { href: "/faq", label: "FAQ", sub: "Fees, teams, payments" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col justify-between gap-10 bg-void p-7 transition-colors hover:bg-dusk"
                >
                  <span className="font-display text-4xl text-flare">{item.label}</span>
                  <span className="flex items-center justify-between text-sm text-mist">
                    {item.sub}
                    <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </nav>
          </Reveal>
        </Container>
      </section>

      {/* Registration CTA */}
      <section aria-labelledby="register-title" className="py-24 sm:py-32">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
          <Reveal>
            <Eyebrow>Registration</Eyebrow>
            <h2 id="register-title" className="mt-3 font-display text-5xl leading-[1.02] text-flare sm:text-6xl">
              Pick an event. Pay. Submit your proof.
            </h2>
            <p className="mt-6 max-w-md text-mist">
              Fees are calculated for you. After paying, you submit your UTR / transaction ID and a payment screenshot, and receive a
              registration ID. The organisers verify each payment manually.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {EVENT_LIST.map((event) => (
                <li key={event.slug}>
                  <Link href={event.registerPath} className="group flex items-center justify-between gap-6 py-5">
                    <span>
                      <span className="block text-lg text-flare">{event.name}</span>
                      <span className="text-sm text-mist">
                        Day {event.day} · {event.format === "TEAM" ? `team of ${event.teamSize}` : "individual"}
                      </span>
                    </span>
                    <span className="flex items-center gap-3 whitespace-nowrap text-sand">
                      {formatInr(registrationAmountInr(event))}
                      <ArrowIcon className="h-4 w-4 text-mist transition-transform duration-300 group-hover:translate-x-1 group-hover:text-flare" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      </section>

      {/* FAQ preview */}
      <section aria-labelledby="faq-title" className="pb-28 pt-8 sm:pb-36">
        <Container className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <Reveal>
            <Eyebrow>Questions</Eyebrow>
            <h2 id="faq-title" className="mt-3 font-display text-5xl text-flare">
              Good to know
            </h2>
            <Link href="/faq" className="mt-6 inline-flex items-center gap-2 text-sand hover:text-flare">
              All FAQs <ArrowIcon />
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <FaqList items={FAQS.filter((f) => f.featured)} />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
