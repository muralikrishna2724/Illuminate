import { BlackHole } from "@/components/visual/BlackHole";
import { Starfield } from "@/components/visual/Starfield";
import { ArrowIcon, ButtonLink } from "@/components/ui/Button";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* Decorative layers — never interactive */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <Starfield density={1} />
        <div className="absolute left-1/2 top-[27%] w-[135vw] max-w-[1100px] -translate-x-1/2 -translate-y-1/2 opacity-80 sm:top-[38%] sm:w-[95vw] sm:opacity-100">
          <BlackHole intensity="hero" />
        </div>
        {/* Vignette so type stays readable */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_30%,rgb(5_4_4/0.55)_70%,rgb(5_4_4)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-b from-transparent to-void" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-14 pt-28 sm:px-8 sm:pb-20">
        <p className="text-sm text-gold/90 sm:text-base">October 8–9 · 2-Day Innovation &amp; Entrepreneurship Event</p>
        <h1 id="hero-title" className="mt-3 font-display text-[19vw] leading-[0.85] tracking-tight text-flare sm:text-[9.5rem] lg:text-[11rem]">
          Illuminate
        </h1>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
          <p className="max-w-xl text-lg leading-relaxed text-sand/90 sm:text-xl">
            At its centre is <span className="text-flare">Illuminate — the Entrepreneurship Workshop</span>, associated with IIT
            Bombay, on Day 2. Day 1 opens with the Deja Vu Hackathon, AI Debate and IPL Auction.
          </p>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <ButtonLink href="/day-2" size="lg">
              Explore Illuminate <ArrowIcon />
            </ButtonLink>
            <ButtonLink href="/day-1" variant="secondary" size="lg">
              Explore Day 1
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
