import type { EventContent } from "@/lib/events/catalog";

/** Highlighted closing block for an event: its motto set large, then summary lines. */
export function EventSpotlight({ spotlight }: { spotlight: NonNullable<EventContent["spotlight"]> }) {
  return (
    <div className="theme-dark relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-br from-baltic via-baltic to-baltic-deep p-7 sm:p-9">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-pacific/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-powder/15 blur-3xl" />

      <p className="relative font-display text-4xl leading-[1.05] text-flare sm:text-5xl">
        <span className="sr-only">{spotlight.motto.join(". ")}.</span>
        <span aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1">
          {spotlight.motto.map((word) => (
            <span key={word}>
              {word}
              <span className="text-powder">.</span>
            </span>
          ))}
        </span>
      </p>

      <div aria-hidden="true" className="relative mt-6 h-px w-16 bg-powder/60" />

      <ul className="relative mt-6 space-y-3">
        {spotlight.lines.map((line) => (
          <li key={line} className="flex gap-3 text-base leading-relaxed text-sand sm:text-lg">
            <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-powder" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
