import Link from "next/link";
import { feeLabel, type EventContent } from "@/lib/events/catalog";
import { ArrowIcon } from "@/components/ui/Button";

/** Editorial list row for an event — used on the homepage and day pages. */
export function EventRow({ event, index, href }: { event: EventContent; index: number; href: string }) {
  return (
    <li className="group relative border-t border-[var(--line)] last:border-b">
      <Link
        href={href}
        className="grid gap-3 py-8 transition-colors sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:gap-8 sm:py-10"
      >
        <span className="font-display text-2xl text-smoke transition-colors group-hover:text-gold">
          {String(index).padStart(2, "0")}
        </span>
        <span>
          <span className="block font-display text-4xl leading-tight text-flare sm:text-5xl">{event.name}</span>
          <span className="mt-2 block text-mist">
            {event.format === "TEAM" ? `Team of ${event.teamSize}` : "Individual"} · {feeLabel(event)}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-sand/80 transition-colors group-hover:text-flare">
          Details <ArrowIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </Link>
    </li>
  );
}
