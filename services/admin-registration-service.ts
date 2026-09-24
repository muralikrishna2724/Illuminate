import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/http/errors";
import { normalizeRegistrationCode } from "@/lib/registration-id";
import type { RegistrationFilters } from "@/lib/validation/admin";
import type {
  DashboardStats,
  EventSlug,
  Paginated,
  RegistrationDetail,
  RegistrationSummary,
} from "@/types/domain";
import { screenshotUrl, toPaymentDto } from "./mappers";

/** Admin date filters are interpreted in Indian Standard Time. */
const IST_OFFSET = "+05:30";

export function buildRegistrationWhere(filters: Omit<RegistrationFilters, "page" | "pageSize">): Prisma.RegistrationWhereInput {
  const and: Prisma.RegistrationWhereInput[] = [];

  if (filters.event) and.push({ event: { slug: filters.event } });
  if (filters.status) and.push({ payment: { status: filters.status } });

  if (filters.from || filters.to) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.from) createdAt.gte = new Date(`${filters.from}T00:00:00.000${IST_OFFSET}`);
    if (filters.to) createdAt.lte = new Date(`${filters.to}T23:59:59.999${IST_OFFSET}`);
    and.push({ createdAt });
  }

  const q = filters.q?.trim();
  if (q) {
    const contains = { contains: q, mode: "insensitive" as const };
    const or: Prisma.RegistrationWhereInput[] = [
      { registrationCode: contains },
      { contactName: contains },
      { contactEmail: contains },
      { contactPhone: contains },
      { college: contains },
      { team: { name: contains } },
      { team: { members: { some: { OR: [{ name: contains }, { email: contains }, { phone: contains }] } } } },
      { participant: { OR: [{ fullName: contains }, { email: contains }, { phone: contains }] } },
    ];
    const utrQuery = q.replace(/[\s-]/g, "").toUpperCase();
    if (utrQuery) or.push({ payment: { utr: { contains: utrQuery } } });
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 4 && digits !== q) {
      or.push({ contactPhone: { contains: digits } });
      or.push({ team: { members: { some: { phone: { contains: digits } } } } });
      or.push({ participant: { phone: { contains: digits } } });
    }
    and.push({ OR: or });
  }

  return and.length ? { AND: and } : {};
}

const summarySelect = {
  registrationCode: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  college: true,
  createdAt: true,
  event: { select: { slug: true, name: true, day: true, format: true } },
  team: { select: { name: true } },
  participant: { select: { fullName: true } },
  payment: {
    select: { id: true, amountInr: true, utr: true, status: true, verifiedAt: true, rejectionReason: true },
  },
} satisfies Prisma.RegistrationSelect;

type SummaryRow = Prisma.RegistrationGetPayload<{ select: typeof summarySelect }>;

function toSummary(row: SummaryRow): RegistrationSummary {
  if (!row.payment) throw new Error(`Registration ${row.registrationCode} has no payment record`);
  return {
    registrationId: row.registrationCode,
    event: {
      slug: row.event.slug as EventSlug,
      name: row.event.name,
      day: row.event.day === 2 ? 2 : 1,
      format: row.event.format,
    },
    displayName: row.team?.name ?? row.participant?.fullName ?? row.contactName,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    college: row.college,
    createdAt: row.createdAt.toISOString(),
    payment: {
      id: row.payment.id,
      amountInr: row.payment.amountInr,
      utr: row.payment.utr,
      status: row.payment.status,
      verifiedAt: row.payment.verifiedAt?.toISOString() ?? null,
      rejectionReason: row.payment.rejectionReason,
      screenshotUrl: screenshotUrl(row.payment.id),
    },
  };
}

export async function listRegistrations(filters: RegistrationFilters): Promise<Paginated<RegistrationSummary>> {
  const where = buildRegistrationWhere(filters);
  const [total, rows] = await prisma.$transaction([
    prisma.registration.count({ where }),
    prisma.registration.findMany({
      where,
      select: summarySelect,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);
  return {
    items: rows.map(toSummary),
    page: filters.page,
    pageSize: filters.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
  };
}

export async function getRegistrationDetail(rawCode: string): Promise<RegistrationDetail> {
  const code = normalizeRegistrationCode(rawCode);
  const row = await prisma.registration.findUnique({
    where: { registrationCode: code },
    select: {
      ...summarySelect,
      updatedAt: true,
      participant: true,
      team: { include: { members: { orderBy: { position: "asc" } } } },
      payment: {
        include: {
          verifiedBy: { select: { name: true } },
          rejectedBy: { select: { name: true } },
          auditLogs: { orderBy: { createdAt: "desc" }, include: { admin: { select: { name: true } } } },
        },
      },
    },
  });
  if (!row || !row.payment) throw notFound("Registration not found.");

  const summary = toSummary({
    ...row,
    team: row.team ? { name: row.team.name } : null,
    participant: row.participant ? { fullName: row.participant.fullName } : null,
  });

  return {
    ...summary,
    updatedAt: row.updatedAt.toISOString(),
    participant: row.participant
      ? {
          fullName: row.participant.fullName,
          email: row.participant.email,
          phone: row.participant.phone,
          college: row.participant.college,
          department: row.participant.department,
          year: row.participant.year,
        }
      : null,
    team: row.team
      ? {
          name: row.team.name,
          college: row.team.college,
          leaderName: row.team.leaderName,
          leaderEmail: row.team.leaderEmail,
          leaderPhone: row.team.leaderPhone,
          members: row.team.members.map((m) => ({
            position: m.position,
            name: m.name,
            email: m.email,
            phone: m.phone,
            department: m.department,
            year: m.year,
          })),
        }
      : null,
    paymentDetail: toPaymentDto(row.payment),
    auditLog: row.payment.auditLogs.map((log) => ({
      action: log.action,
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      reason: log.reason,
      adminName: log.admin?.name ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [events, grouped] = await Promise.all([
    prisma.event.findMany({ select: { id: true, slug: true, name: true, day: true }, orderBy: [{ day: "asc" }, { name: "asc" }] }),
    prisma.$queryRaw<Array<{ eventId: string; status: "PENDING" | "VERIFIED" | "REJECTED"; count: bigint }>>`
      SELECT r."eventId" AS "eventId", p."status" AS "status", COUNT(*)::bigint AS "count"
      FROM "Registration" r
      JOIN "Payment" p ON p."registrationId" = r."id"
      GROUP BY r."eventId", p."status"
    `,
  ]);

  const byEvent = events.map((event) => {
    const rows = grouped.filter((g) => g.eventId === event.id);
    const count = (status: string) => Number(rows.find((r) => r.status === status)?.count ?? 0);
    const pending = count("PENDING");
    const verified = count("VERIFIED");
    const rejected = count("REJECTED");
    return {
      slug: event.slug as EventSlug,
      name: event.name,
      day: event.day,
      total: pending + verified + rejected,
      pending,
      verified,
      rejected,
    };
  });

  const sum = (fn: (e: (typeof byEvent)[number]) => number) => byEvent.reduce((acc, e) => acc + fn(e), 0);

  return {
    totalRegistrations: sum((e) => e.total),
    day1Registrations: sum((e) => (e.day === 1 ? e.total : 0)),
    day2Registrations: sum((e) => (e.day === 2 ? e.total : 0)),
    pendingPayments: sum((e) => e.pending),
    verifiedPayments: sum((e) => e.verified),
    rejectedPayments: sum((e) => e.rejected),
    byEvent: byEvent.map(({ day: _day, ...rest }) => rest),
  };
}
