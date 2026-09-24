import "server-only";
import { prisma } from "@/lib/db/prisma";
import { toCsv } from "@/lib/csv";
import type { RegistrationFilters } from "@/lib/validation/admin";
import { buildRegistrationWhere } from "./admin-registration-service";

const MAX_EXPORT_ROWS = 50_000;
const MEMBER_SLOTS = 4;

function formatIst(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Builds a CSV of registrations matching the admin filters. One row per registration. */
export async function exportRegistrationsCsv(filters: Omit<RegistrationFilters, "page" | "pageSize">): Promise<string> {
  const rows = await prisma.registration.findMany({
    where: buildRegistrationWhere(filters),
    orderBy: { createdAt: "asc" },
    take: MAX_EXPORT_ROWS,
    include: {
      event: { select: { name: true, day: true } },
      participant: true,
      team: { include: { members: { orderBy: { position: "asc" } } } },
      payment: { include: { verifiedBy: { select: { name: true } }, rejectedBy: { select: { name: true } } } },
    },
  });

  const header = [
    "Registration ID",
    "Event",
    "Day",
    "Participant / Team Name",
    "College",
    "Contact Name",
    "Email",
    "Phone",
    "Department",
    "Year",
    "UTR",
    "Amount (INR)",
    "Payment Status",
    "Created (IST)",
    "Verified (IST)",
    "Verified By",
    "Rejected (IST)",
    "Rejected By",
    "Rejection Reason",
  ];
  for (let i = 1; i <= MEMBER_SLOTS; i++) {
    header.push(`Member ${i} Name`, `Member ${i} Email`, `Member ${i} Phone`, `Member ${i} Department`, `Member ${i} Year`);
  }

  const data = rows.map((r) => {
    const row: Array<string | number | null> = [
      r.registrationCode,
      r.event.name,
      `Day ${r.event.day}`,
      r.team?.name ?? r.participant?.fullName ?? r.contactName,
      r.college,
      r.contactName,
      r.contactEmail,
      r.contactPhone,
      r.participant?.department ?? "",
      r.participant?.year ?? "",
      r.payment?.utr ?? "",
      r.payment?.amountInr ?? "",
      r.payment?.status ?? "",
      formatIst(r.createdAt),
      formatIst(r.payment?.verifiedAt),
      r.payment?.verifiedBy?.name ?? "",
      formatIst(r.payment?.rejectedAt),
      r.payment?.rejectedBy?.name ?? "",
      r.payment?.rejectionReason ?? "",
    ];
    for (let i = 0; i < MEMBER_SLOTS; i++) {
      const m = r.team?.members[i];
      row.push(m?.name ?? "", m?.email ?? "", m?.phone ?? "", m?.department ?? "", m?.year ?? "");
    }
    return row;
  });

  return toCsv(header, data);
}
