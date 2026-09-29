import Image from "next/image";
import { HeroBlackHole } from "@/components/visual/BlackHole";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";
import { EVENT_YEAR_LABEL } from "@/lib/events/catalog";
import { HOST, TAGLINE } from "@/lib/site-config";
import { Countdown } from "./Countdown";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="theme-dark relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-void">
      {/* Decorative layers — never interactive */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <HeroBlackHole />
        {/* Keep type readable where the disk sweeps behind it */}
        <div className="absolute inset-0 bg-gradient-to-t from-void from-30% via-void/60 via-50% to-transparent to-70% md:bg-gradient-to-r md:from-void/90 md:from-10% md:via-void/30 md:via-45% md:to-transparent md:to-60%" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-void" />
      </div>

      {/* Host college's logo, top right above the black hole */}
      <div className="absolute inset-x-0 top-24 z-10 hidden md:block">
        <div className="mx-auto flex max-w-6xl justify-end px-5 sm:px-8">
          <HostLogo className="h-24 w-24 p-2" />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-14 pt-28 sm:px-8 md:justify-center md:pb-24">
        <div className="max-w-2xl">
          {/* On narrow screens the logo joins the content so it never covers text. */}
          <HostLogo className="mb-6 h-16 w-16 p-1.5 md:hidden" />
          <p className="text-sm font-medium text-gold sm:text-base">Hosted by {HOST.name}</p>
          <h1 id="hero-title" className="mt-4 font-display text-[17vw] leading-[0.88] text-flare sm:text-[8.5rem] lg:text-[9.5rem]">
            Illuminate
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

function HostLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-full bg-white shadow-lg shadow-black/40 ring-1 ring-white/30 ${className}`}>
      <Image
        src={HOST.logo.src}
        alt={`${HOST.name} logo`}
        width={HOST.logo.width}
        height={HOST.logo.height}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}
