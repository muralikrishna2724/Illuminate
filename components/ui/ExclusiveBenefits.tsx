import { DAY_1_REWARDS } from "@/lib/events/catalog";
import { EXCLUSIVE_BENEFITS } from "@/lib/events/workshop";

interface Rewards {
  note: string;
  headline: string;
  items: readonly string[];
}

/** Baltic Blue callout for rewards and limited-time benefits. */
export function RewardsCard({ id, rewards, className = "" }: { id: string; rewards: Rewards; className?: string }) {
  return (
    <aside
      aria-labelledby={id}
      className={`theme-dark relative overflow-hidden rounded-3xl bg-gradient-to-br from-baltic to-baltic-deep p-7 sm:p-9 ${className}`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-powder/20 blur-3xl" />
      <p className="text-xs font-medium tracking-[0.16em] text-powder uppercase">{rewards.note}</p>
      <h3 id={id} className="mt-2 font-display text-3xl text-flare sm:text-4xl">
        {rewards.headline}
      </h3>
      <ul className="mt-5 space-y-2.5 text-sand">
        {rewards.items.map((item) => (
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

/** The Illuminate workshop's limited-time benefits (Day 2). */
export function ExclusiveBenefits({ className = "" }: { className?: string }) {
  return <RewardsCard id="exclusive-benefits-title" rewards={EXCLUSIVE_BENEFITS} className={className} />;
}

/** Prizes for the Day 1 competitions. */
export function Day1Rewards({ className = "" }: { className?: string }) {
  return <RewardsCard id="day-1-rewards-title" rewards={DAY_1_REWARDS} className={className} />;
}
