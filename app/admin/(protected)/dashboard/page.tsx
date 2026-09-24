import type { Metadata } from "next";
import { RegistrationsManager } from "@/components/admin/RegistrationsManager";
import { EventBreakdown, StatsGrid } from "@/components/admin/StatsGrid";
import { getDashboardStats } from "@/services/admin-registration-service";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-medium text-flare">Dashboard</h1>
        <p className="mt-1 text-sm text-mist">Live figures from the registrations database.</p>
      </div>
      <StatsGrid stats={stats} />
      <RegistrationsManager title="Payments to review" defaultStatus="PENDING" />
      <div>
        <h2 className="mb-3 text-sm text-mist">By event</h2>
        <EventBreakdown stats={stats} />
      </div>
    </div>
  );
}
