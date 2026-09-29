import type { Metadata } from "next";
import Link from "next/link";
import { RegistrationsManager } from "@/components/admin/RegistrationsManager";
import { EventBreakdown, StatsGrid } from "@/components/admin/StatsGrid";
import { getDashboardStats } from "@/services/admin-registration-service";
import { listAttempts } from "@/services/attempt-service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const [stats, attempts] = await Promise.all([getDashboardStats(), listAttempts()]);
  const unresolvedAttempts = attempts.filter((a) => !a.registeredAs).length;
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-medium text-flare">Dashboard</h1>
        <p className="mt-1 text-sm text-mist">Live figures from the registrations database.</p>
      </div>
      <StatsGrid stats={stats} />
      {unresolvedAttempts > 0 && (
        <Link
          href="/admin/attempts"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warn/40 bg-warn/10 px-5 py-4 text-sm text-warn hover:bg-warn/15"
        >
          <span>
            <strong className="font-semibold">{unresolvedAttempts}</strong> failed registration attempt{unresolvedAttempts === 1 ? "" : "s"} from
            people who haven’t registered yet — match them against your payments.
          </span>
          <span className="font-medium">View failed attempts →</span>
        </Link>
      )}
      <RegistrationsManager title="Payments to review" defaultStatus="PENDING" />
      <div>
        <h2 className="mb-3 text-sm text-mist">By event</h2>
        <EventBreakdown stats={stats} />
      </div>
    </div>
  );
}
