"use client";

import { useSyncExternalStore } from "react";

// Day 1 starts on October 9 (IST). No start time is confirmed, so the clock
// counts down to the start of the day and the event runs to the end of Day 2.
const START = Date.parse("2026-10-09T00:00:00+05:30");
const END = Date.parse("2026-10-11T00:00:00+05:30");

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
// Whole seconds, so the snapshot only changes once per tick.
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
const getServerSnapshot = () => null;

/** Live countdown to Day 1. Renders dashes on the server and fills in on the client. */
export function Countdown({ className = "" }: { className?: string }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (now !== null && now >= END) return null;
  if (now !== null && now >= START) {
    return (
      <p className={`inline-flex items-center gap-3 text-sm font-medium text-gold ${className}`}>
        <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-gold" />
        INNOVENTRA is happening now
      </p>
    );
  }

  const remaining = now === null ? null : Math.max(0, START - now);
  const units: Array<[string, number | null]> = [
    ["Days", remaining === null ? null : Math.floor(remaining / 86_400_000)],
    ["Hours", remaining === null ? null : Math.floor(remaining / 3_600_000) % 24],
    ["Mins", remaining === null ? null : Math.floor(remaining / 60_000) % 60],
    ["Secs", remaining === null ? null : Math.floor(remaining / 1000) % 60],
  ];

  return (
    <div className={className}>
      <p className="text-xs font-medium tracking-[0.18em] text-mist uppercase">Countdown to Day 1 · October 9</p>
      <dl
        className="mt-3 inline-grid grid-cols-4 overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-night/60 backdrop-blur-sm"
        aria-label={remaining === null ? "Countdown to October 9" : undefined}
      >
        {units.map(([label, value]) => (
          <div key={label} className="flex min-w-[4.5rem] flex-col-reverse items-center border-l border-[var(--line)] px-3 py-3 first:border-l-0 sm:min-w-[5.5rem] sm:px-5">
            <dt className="mt-1 text-[0.65rem] tracking-[0.16em] text-mist uppercase">{label}</dt>
            <dd className="font-display text-3xl text-flare tabular-nums sm:text-4xl">
              {value === null ? "--" : String(value).padStart(2, "0")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
