import { EXCLUSIVE_BENEFITS } from "@/lib/events/workshop";

/** Baltic Blue callout for the Illuminate workshop's limited-time benefits. */
export function ExclusiveBenefits({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-labelledby="exclusive-benefits-title"
      className={`theme-dark relative overflow-hidden rounded-3xl bg-gradient-to-br from-baltic to-baltic-deep p-7 sm:p-9 ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-powder/20 blur-3xl" />
      <p className="text-xs font-medium tracking-[0.16em] text-powder uppercase">{EXCLUSIVE_BENEFITS.note}</p>
      <h3 id="exclusive-benefits-title" className="mt-2 font-display text-3xl text-flare sm:text-4xl">
        {EXCLUSIVE_BENEFITS.headline}
      </h3>
      <ul className="mt-5 space-y-2.5 text-sand">
        {EXCLUSIVE_BENEFITS.items.map((item) => (
          <li key={item} className="flex gap-3">
            <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-powder" fill="none" aria-hidden="true">
              <path d="M8 1.5l1.8 4.1 4.4.4-3.3 2.9 1 4.3L8 10.9 4.1 13.2l1-4.3L1.8 6l4.4-.4L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
