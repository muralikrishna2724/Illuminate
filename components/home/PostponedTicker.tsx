import { EVENT_YEAR_LABEL } from "@/lib/events/catalog";

const ITEMS = [
  { text: "Innoventra has been postponed", className: "text-powder" },
  { text: `Now on ${EVENT_YEAR_LABEL}, 2026`, className: "text-flare" },
];

/** A slow, edge-faded marquee announcing the new dates. Blends into the hero — no box, no border. */
export function PostponedTicker() {
  // Repeat the message so one copy always fills the widest screens; the track holds two copies and
  // slides by exactly one, so the loop is seamless.
  const copy = Array.from({ length: 4 }, () => ITEMS).flat();

  return (
    <div
      role="note"
      className="group relative mb-8 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] sm:mb-10"
    >
      <p className="sr-only">
        Innoventra has been postponed. New dates: {EVENT_YEAR_LABEL}, 2026.
      </p>
      <div aria-hidden="true" className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
        {[0, 1].map((n) => (
          <ul key={n} className="flex shrink-0 items-center">
            {copy.map((item, i) => (
              <li
                key={i}
                className={`flex items-center whitespace-nowrap text-xs font-medium tracking-[0.22em] uppercase sm:text-sm ${item.className}`}
              >
                {item.text}
                <span className="mx-5 h-1 w-1 rounded-full bg-gold sm:mx-8" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
