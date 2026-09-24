import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { feeLabel, formatInr, registrationAmountInr, type EventContent } from "@/lib/events/catalog";

/** Full event block used on the Day 1 page. */
export function EventDetail({ event, index }: { event: EventContent; index: number }) {
  return (
    <article id={event.slug} aria-labelledby={`${event.slug}-title`} className="scroll-mt-24 border-t border-[var(--line)] py-16 sm:py-20">
      <Reveal className="grid gap-10 lg:grid-cols-[5rem_1fr_18rem]">
        <p className="font-display text-3xl text-smoke">{String(index).padStart(2, "0")}</p>
        <div>
          <h2 id={`${event.slug}-title`} className="font-display text-5xl leading-tight text-flare sm:text-6xl">
            {event.name}
          </h2>
          <p className="mt-3 text-gold/90">{event.tagline}</p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-sand/85">{event.description}</p>

          {event.highlights.map((group) => (
            <div key={group.title} className="mt-8">
              <h3 className="text-sm text-mist">{group.title}</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item} className="rounded-full border border-[var(--line-strong)] px-4 py-1.5 text-sm text-flare">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}

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
        </div>

        <aside className="self-start lg:border-l lg:border-[var(--line)] lg:pl-8">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-mist">Date</dt>
              <dd className="mt-1 text-flare">
                Day {event.day} · {event.dateLabel}
              </dd>
            </div>
            <div>
              <dt className="text-mist">Format</dt>
              <dd className="mt-1 text-flare">{event.format === "TEAM" ? `Team of exactly ${event.teamSize}` : "Individual"}</dd>
            </div>
            <div>
              <dt className="text-mist">Fee</dt>
              <dd className="mt-1 text-flare">{feeLabel(event)}</dd>
            </div>
          </dl>
          <ButtonLink href={event.registerPath} className="mt-8 w-full">
            Register · {formatInr(registrationAmountInr(event))}
          </ButtonLink>
        </aside>
      </Reveal>
    </article>
  );
}
