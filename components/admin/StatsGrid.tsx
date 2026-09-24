import Link from "next/link";
import type { DashboardStats } from "@/types/domain";

/** Real counts from the database — no placeholder numbers. */
export function StatsGrid({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: "Total registrations", value: stats.totalRegistrations },
    { label: "Day 1 registrations", value: stats.day1Registrations },
    { label: "Day 2 registrations", value: stats.day2Registrations },
    { label: "Pending payments", value: stats.pendingPayments, tone: "text-amber-200" },
    { label: "Verified payments", value: stats.verifiedPayments, tone: "text-emerald-200" },
    { label: "Rejected payments", value: stats.rejectedPayments, tone: "text-red-200" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-[var(--line)] sm:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="bg-[#0d0b0a] p-5">
          <dt className="text-xs text-mist">{item.label}</dt>
          <dd className={`mt-2 text-3xl font-semibold tabular-nums ${item.tone ?? "text-flare"}`}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EventBreakdown({ stats }: { stats: DashboardStats }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
      <table className="w-full min-w-[32rem] text-sm">
        <caption className="sr-only">Registrations by event</caption>
        <thead className="text-left text-xs text-mist">
          <tr className="border-b border-[var(--line)]">
            <th scope="col" className="px-4 py-3 font-normal">Event</th>
            <th scope="col" className="px-4 py-3 text-right font-normal">Total</th>
            <th scope="col" className="px-4 py-3 text-right font-normal">Pending</th>
            <th scope="col" className="px-4 py-3 text-right font-normal">Verified</th>
            <th scope="col" className="px-4 py-3 text-right font-normal">Rejected</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {stats.byEvent.map((e) => (
            <tr key={e.slug} className="border-b border-[var(--line)] last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-normal text-flare">
                <Link href={`/admin/${e.slug}`} className="hover:underline">
                  {e.name}
                </Link>
              </th>
              <td className="px-4 py-3 text-right text-flare">{e.total}</td>
              <td className="px-4 py-3 text-right text-amber-200">{e.pending}</td>
              <td className="px-4 py-3 text-right text-emerald-200">{e.verified}</td>
              <td className="px-4 py-3 text-right text-red-200">{e.rejected}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
