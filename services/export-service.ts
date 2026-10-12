import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toCsv } from "@/lib/csv";
import { DEBATE_SURVEY_QUESTIONS } from "@/lib/events/debate-survey";
import { themeLabel } from "@/lib/events/themes";
import { isCvrCollege } from "@/lib/college";
import { EVENT_LIST, EVENTS } from "@/lib/events/catalog";
import { EXPORT_FIELD_KEYS, exportFieldsFor, type ExportFieldKey, type ExportRowMode } from "@/lib/export-fields";
import { renderTablePdf } from "@/lib/pdf/table-pdf";
import type { RegistrationFilters } from "@/lib/validation/admin";
import { buildRegistrationWhere } from "./admin-registration-service";
import { reviewSurvey } from "./debate-survey-scoring";

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

const exportInclude = {
  event: { select: { slug: true, name: true, day: true } },
  participant: true,
  team: { include: { members: { orderBy: { position: "asc" } } } },
  payment: {
    omit: { screenshotFingerprint: true },
    include: { verifiedBy: { select: { name: true } }, rejectedBy: { select: { name: true } } },
  },
} satisfies Prisma.RegistrationInclude;

type ExportRow = Prisma.RegistrationGetPayload<{ include: typeof exportInclude }>;
type Cell = string | number | null;
type Survey = ReturnType<typeof reviewSurvey>;
/** The person a row is about, in the per-student layout. */
interface Student {
  name: string;
  email: string;
  phone: string;
  department: string;
  year: string;
}
type ColumnKey = Exclude<ExportFieldKey, MemberFieldKey>;

/** Header(s) and value(s) for each exportable field. Member fields are laid out per member below. */
const COLUMNS: Record<ColumnKey, { headers: (rows: ExportRowMode) => string[]; values: (r: ExportRow, survey: Survey, student: Student | null) => Cell[] }> = {
  registrationId: { headers: () => ["Registration ID"], values: (r) => [r.registrationCode] },
  event: { headers: () => ["Event"], values: (r) => [r.event.name] },
  day: { headers: () => ["Day"], values: (r) => [`Day ${r.event.day}`] },
  name: {
    headers: (rows) => [rows === "students" ? "Name" : "Participant / Team Name"],
    values: (r, _s, student) => [student?.name ?? r.team?.name ?? r.participant?.fullName ?? r.contactName],
  },
  teamName: { headers: () => ["Team Name"], values: (r) => [r.team?.name ?? ""] },
  theme: { headers: () => ["Theme"], values: (r) => [themeLabel(r.team?.theme) ?? ""] },
  college: { headers: () => ["College"], values: (r) => [r.college] },
  contactName: { headers: () => ["Contact Name"], values: (r) => [r.contactName] },
  email: { headers: () => ["Email"], values: (r, _s, student) => [student?.email ?? r.contactEmail] },
  phone: { headers: () => ["Phone"], values: (r, _s, student) => [student?.phone ?? r.contactPhone] },
  department: { headers: () => ["Department"], values: (r, _s, student) => [student?.department ?? r.participant?.department ?? ""] },
  year: { headers: () => ["Year"], values: (r, _s, student) => [student?.year ?? r.participant?.year ?? ""] },
  utr: { headers: () => ["UTR"], values: (r) => [r.payment?.utr ?? ""] },
  amount: { headers: () => ["Amount (INR)"], values: (r) => [r.payment?.amountInr ?? ""] },
  status: { headers: () => ["Payment Status"], values: (r) => [r.payment?.status ?? ""] },
  createdAt: { headers: () => ["Created (IST)"], values: (r) => [formatIst(r.createdAt)] },
  verifiedAt: { headers: () => ["Verified (IST)"], values: (r) => [formatIst(r.payment?.verifiedAt)] },
  verifiedBy: { headers: () => ["Verified By"], values: (r) => [r.payment?.verifiedBy?.name ?? ""] },
  rejectedAt: { headers: () => ["Rejected (IST)"], values: (r) => [formatIst(r.payment?.rejectedAt)] },
  rejectedBy: { headers: () => ["Rejected By"], values: (r) => [r.payment?.rejectedBy?.name ?? ""] },
  rejectionReason: { headers: () => ["Rejection Reason"], values: (r) => [r.payment?.rejectionReason ?? ""] },
  screenshotMatch: { headers: () => ["Screenshot Same As"], values: (r) => [r.payment?.screenshotMatchCode ?? ""] },
  surveyScore: { headers: () => ["AI Survey Score"], values: (_r, survey) => [survey ? `${survey.score}/${survey.outOf}` : ""] },
  surveyAnswers: {
    headers: () => DEBATE_SURVEY_QUESTIONS.map((q) => `Survey: ${q.prompt}`),
    values: (_r, survey) => DEBATE_SURVEY_QUESTIONS.map((_, i) => survey?.answers[i]?.answer ?? ""),
  },
  surveyTopic: { headers: () => ["Survey: Topic to debate"], values: (_r, survey) => [survey?.topic ?? ""] },
};

type MemberFieldKey = "memberName" | "memberEmail" | "memberPhone" | "memberDepartment" | "memberYear";
type Member = NonNullable<ExportRow["team"]>["members"][number];
const MEMBER_COLUMNS: Record<MemberFieldKey, { label: string; value: (m: Member) => string }> = {
  memberName: { label: "Name", value: (m) => m.name },
  memberEmail: { label: "Email", value: (m) => m.email },
  memberPhone: { label: "Phone", value: (m) => m.phone },
  memberDepartment: { label: "Department", value: (m) => m.department },
  memberYear: { label: "Year", value: (m) => m.year },
};
const isMemberField = (key: ExportFieldKey): key is MemberFieldKey => key in MEMBER_COLUMNS;

/** Everyone a registration covers: each team member, or the individual registrant. */
function studentsOf(r: ExportRow): Student[] {
  if (r.team) return r.team.members.map((m) => ({ name: m.name, email: m.email, phone: m.phone, department: m.department, year: m.year }));
  if (r.participant) {
    const p = r.participant;
    return [{ name: p.fullName, email: p.email, phone: p.phone, department: p.department, year: p.year }];
  }
  return [{ name: r.contactName, email: r.contactEmail, phone: r.contactPhone, department: "", year: "" }];
}

export interface ExportOptions {
  /** Chosen fields; empty or omitted = every field of the layout. */
  fields?: readonly ExportFieldKey[];
  rows?: ExportRowMode;
  /** Only registrations from CVR College of Engineering (however the college was typed). */
  cvrOnly?: boolean;
}

interface ExportTable {
  header: string[];
  rows: Array<{ eventSlug: string; eventName: string; cells: Cell[] }>;
}

async function buildExport(filters: Omit<RegistrationFilters, "page" | "pageSize">, options: ExportOptions): Promise<ExportTable> {
  const layout = options.rows ?? "registrations";
  const offered = new Set(exportFieldsFor(null, layout).map((f) => f.key as ExportFieldKey));
  const chosen = new Set(options.fields?.length ? options.fields : EXPORT_FIELD_KEYS);
  const keys = EXPORT_FIELD_KEYS.filter((k) => chosen.has(k) && offered.has(k));
  const plain = keys.filter((k): k is ColumnKey => !isMemberField(k));
  const member = keys.filter(isMemberField);

  const found = await prisma.registration.findMany({
    where: buildRegistrationWhere(filters),
    orderBy: { createdAt: "asc" },
    take: MAX_EXPORT_ROWS,
    include: exportInclude,
  });
  const registrations = options.cvrOnly ? found.filter((r) => isCvrCollege(r.college)) : found;

  const header = plain.flatMap((k) => COLUMNS[k].headers(layout));
  for (let i = 1; i <= MEMBER_SLOTS && member.length; i++) {
    header.push(...member.map((k) => `Member ${i} ${MEMBER_COLUMNS[k].label}`));
  }

  const rows: ExportTable["rows"] = [];
  for (const r of registrations) {
    const survey = plain.some((k) => k.startsWith("survey")) ? reviewSurvey(r.survey) : null;
    const people = layout === "students" ? studentsOf(r) : [null];
    for (const student of people) {
      const cells: Cell[] = plain.flatMap((k) => COLUMNS[k].values(r, survey, student));
      for (let i = 0; i < MEMBER_SLOTS && member.length; i++) {
        const m = r.team?.members[i];
        cells.push(...member.map((k) => (m ? MEMBER_COLUMNS[k].value(m) : "")));
      }
      rows.push({ eventSlug: r.event.slug, eventName: r.event.name, cells });
    }
  }
  return { header, rows };
}

/**
 * Builds a CSV of registrations matching the admin filters, with the chosen
 * fields in their standard order (all of them when none are chosen): one row
 * per registration, or one per student.
 */
export async function exportRegistrationsCsv(
  filters: Omit<RegistrationFilters, "page" | "pageSize">,
  options: ExportOptions = {},
): Promise<string> {
  const table = await buildExport(filters, options);
  return toCsv(table.header, table.rows.map((r) => r.cells));
}

/** The same export as a PDF table with an S.No column; one section per event. */
export async function exportRegistrationsPdf(
  filters: Omit<RegistrationFilters, "page" | "pageSize">,
  options: ExportOptions = {},
): Promise<Uint8Array> {
  const table = await buildExport(filters, options);
  const order = EVENT_LIST.map((e) => e.slug as string);
  const slugs = [...new Set(table.rows.map((r) => r.eventSlug))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const noun = (n: number) => (options.rows === "students" ? `${n} student${n === 1 ? "" : "s"}` : `${n} registration${n === 1 ? "" : "s"}`);
  const sections = (slugs.length ? slugs : [filters.event ?? ""]).map((slug) => {
    const rows = table.rows.filter((r) => r.eventSlug === slug);
    const name = rows[0]?.eventName ?? (filters.event ? EVENTS[filters.event].name : "Registrations");
    return { heading: `${name} — ${noun(rows.length)}`, header: ["S.No", ...table.header], rows: rows.map((r, i) => [i + 1, ...r.cells]) };
  });

  const scope = [
    filters.status ? `${filters.status.toLowerCase()} payments` : "all payment statuses",
    options.cvrOnly ? "CVR College of Engineering only" : null,
    filters.q ? `search "${filters.q}"` : null,
    filters.from || filters.to ? `registered ${filters.from ?? "…"} to ${filters.to ?? "…"}` : null,
  ].filter(Boolean);
  return renderTablePdf({
    title: `INNOVENTRA 2026 — ${filters.event ? EVENTS[filters.event].name : "All events"}`,
    subtitle: `Exported ${formatIst(new Date())} IST · ${scope.join(" · ")}`,
    sections,
  });
}

/** Deja Vu team list for organisers: team name and the team leader's phone. One row per team. */
export async function exportTeamContactsCsv(filters: Omit<RegistrationFilters, "page" | "pageSize">): Promise<string> {
  const rows = await prisma.registration.findMany({
    where: { AND: [buildRegistrationWhere(filters), { team: { isNot: null } }] },
    orderBy: { createdAt: "asc" },
    take: MAX_EXPORT_ROWS,
    select: { contactPhone: true, team: { select: { name: true, leaderPhone: true } } },
  });
  return toCsv(
    ["Team Name", "Team Leader Phone"],
    rows.map((r) => [r.team?.name ?? "", r.team?.leaderPhone ?? r.contactPhone]),
  );
}
