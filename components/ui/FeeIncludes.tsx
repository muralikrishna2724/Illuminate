import { feeIncludes, type EventContent } from "@/lib/events/catalog";

/** "Included in the fee" list, shown only for events with confirmed inclusions. */
export function FeeIncludes({ event, className = "" }: { event: EventContent; className?: string }) {
  const items = feeIncludes(event);
  if (items.length === 0) return null;
  return (
    <div className={className}>
      <p className="text-xs font-medium tracking-[0.14em] text-gold uppercase">Included in the fee</p>
      <ul className="mt-3 space-y-1.5 text-sm text-sand/85">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" aria-hidden="true">
              <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
