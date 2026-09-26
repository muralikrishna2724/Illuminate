import { HeroBlackHole } from "@/components/visual/BlackHole";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-black">
      {/* Decorative layers — never interactive */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <HeroBlackHole />
        {/* Keep type readable where the disk sweeps behind it */}
        <div className="absolute inset-0 bg-gradient-to-t from-void from-30% via-void/60 via-50% to-transparent to-70% md:bg-gradient-to-r md:from-black/80 md:from-10% md:via-black/20 md:via-45% md:to-transparent md:to-60%" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-void" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-14 pt-28 sm:px-8 md:justify-center md:pb-24">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-gold sm:text-base">October 8–9 · 2-Day Innovation &amp; Entrepreneurship Event</p>
          <h1 id="hero-title" className="mt-4 font-display text-[17vw] leading-[0.88] text-flare sm:text-[8.5rem] lg:text-[9.5rem]">
            Illuminate
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-sand/90 sm:text-xl">
            At its centre is <span className="text-flare">Illuminate — the Entrepreneurship Workshop</span>, an initiative by
            E-Cell IIT Bombay, on Day 2. Day 1 opens with the Deja Vu Hackathon, AI Debate and IPL Auction.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/day-2" size="lg">
              Explore Illuminate <ArrowIcon />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
