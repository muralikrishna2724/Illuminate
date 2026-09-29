import Image from "next/image";
import { HeroBlackHole } from "@/components/visual/BlackHole";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { EVENT_YEAR_LABEL } from "@/lib/events/catalog";
import { HERO_PARTNERS, HOST, TAGLINE } from "@/lib/site-config";
import { Countdown } from "./Countdown";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="theme-dark relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-void">
      {/* Decorative layers — never interactive */}
      {/* Starts below the partner lockup so the black hole sits under it */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 top-44 -z-10 sm:top-52">
        <HeroBlackHole />
        {/* Keep type readable where the disk sweeps behind it */}
        <div className="absolute inset-0 bg-gradient-to-t from-void from-30% via-void/60 via-50% to-transparent to-70% md:bg-gradient-to-r md:from-void/90 md:from-10% md:via-void/30 md:via-45% md:to-transparent md:to-60%" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-void" />
      </div>

      {/* E-Cell IIT Bombay × E-Cell CVR College × NEC */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-24 sm:px-8 sm:pt-28">
        <ul aria-label="Presented by" className="flex items-start gap-2.5 sm:gap-5">
          {HERO_PARTNERS.map((partner, i) => (
            <li key={partner.name} className="flex items-start gap-2.5 sm:gap-5">
              {i > 0 && (
                <span aria-hidden="true" className="flex h-11 items-center text-lg font-light text-powder/70 sm:h-20 sm:text-2xl">
                  ×
                </span>
              )}
              <span className="flex flex-col items-center">
                <Image
                  src={partner.logo.src}
                  alt={`${partner.name} logo`}
                  width={partner.logo.width}
                  height={partner.logo.height}
                  priority
                  className="h-11 w-auto sm:h-20"
                />
                <span className="mt-2 max-w-[6.5rem] text-center text-[0.6rem] leading-snug font-medium tracking-[0.12em] text-mist uppercase sm:max-w-none sm:text-xs">
                  {partner.name}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-14 pt-12 sm:px-8 md:justify-center md:pb-24 md:pt-16">
        <div className="max-w-2xl">
          <h1 id="hero-title" className="font-display text-[17vw] leading-[0.88] text-flare sm:text-[8.5rem] lg:text-[9.5rem]">
            Innoventra
          </h1>
          <p className="mt-5 text-sm font-medium tracking-[0.35em] text-powder uppercase sm:text-base">
            <span className="sr-only">{TAGLINE.join(", ")}</span>
            <span aria-hidden="true">
              {TAGLINE.map((word, i) => (
                <span key={word}>
                  {i > 0 && <span className="mx-3 text-gold">/</span>}
                  {word}
                </span>
              ))}
            </span>
          </p>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-sand/90 sm:text-xl">
            At its centre is <span className="text-flare">Illuminate — the Entrepreneurship Workshop</span>, an initiative by
            E-Cell IIT Bombay, on Day 2. Day 1 opens with the Deja Vu Hackathon, Under the Hood of AI and IPL Auction.
          </p>
          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-6 border-t border-[var(--line)] pt-5 text-sm">
            <div>
              <dt className="text-xs tracking-[0.16em] text-mist uppercase">Dates</dt>
              <dd className="mt-1 text-flare">{EVENT_YEAR_LABEL}, 2026</dd>
            </div>
            <div>
              <dt className="text-xs tracking-[0.16em] text-mist uppercase">Venue</dt>
              <dd className="mt-1 text-flare">
                {HOST.name}, {HOST.town}
              </dd>
            </div>
          </dl>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/day-2" size="lg">
              Explore Illuminate <ArrowIcon />
            </ButtonLink>
          </div>
          <Countdown className="mt-10" />
        </div>
      </div>
    </section>
  );
}
