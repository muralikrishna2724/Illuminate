import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { toCsv } from "@/lib/csv";
import { DEBATE_SURVEY_QUESTIONS } from "@/lib/events/debate-survey";
import { themeLabel } from "@/lib/events/themes";
import { EXPORT_FIELD_KEYS, type ExportFieldKey } from "@/lib/export-fields";
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
  event: { select: { name: true, day: true } },
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

/** Header(s) and value(s) for each exportable field. Member fields are laid out per member below. */
const COLUMNS: Record<Exclude<ExportFieldKey, MemberFieldKey>, { headers: string[]; values: (r: ExportRow, survey: Survey) => Cell[] }> = {
  registrationId: { headers: ["Registration ID"], values: (r) => [r.registrationCode] },
  event: { headers: ["Event"], values: (r) => [r.event.name] },
  day: { headers: ["Day"], values: (r) => [`Day ${r.event.day}`] },
  name: { headers: ["Participant / Team Name"], values: (r) => [r.team?.name ?? r.participant?.fullName ?? r.contactName] },
  theme: { headers: ["Theme"], values: (r) => [themeLabel(r.team?.theme) ?? ""] },
  college: { headers: ["College"], values: (r) => [r.college] },
  contactName: { headers: ["Contact Name"], values: (r) => [r.contactName] },
  email: { headers: ["Email"], values: (r) => [r.contactEmail] },
  phone: { headers: ["Phone"], values: (r) => [r.contactPhone] },
  department: { headers: ["Department"], values: (r) => [r.participant?.department ?? ""] },
  year: { headers: ["Year"], values: (r) => [r.participant?.year ?? ""] },
  utr: { headers: ["UTR"], values: (r) => [r.payment?.utr ?? ""] },
  amount: { headers: ["Amount (INR)"], values: (r) => [r.payment?.amountInr ?? ""] },
  status: { headers: ["Payment Status"], values: (r) => [r.payment?.status ?? ""] },
  createdAt: { headers: ["Created (IST)"], values: (r) => [formatIst(r.createdAt)] },
  verifiedAt: { headers: ["Verified (IST)"], values: (r) => [formatIst(r.payment?.verifiedAt)] },
  verifiedBy: { headers: ["Verified By"], values: (r) => [r.payment?.verifiedBy?.name ?? ""] },
  rejectedAt: { headers: ["Rejected (IST)"], values: (r) => [formatIst(r.payment?.rejectedAt)] },
  rejectedBy: { headers: ["Rejected By"], values: (r) => [r.payment?.rejectedBy?.name ?? ""] },
  rejectionReason: { headers: ["Rejection Reason"], values: (r) => [r.payment?.rejectionReason ?? ""] },
  screenshotMatch: { headers: ["Screenshot Same As"], values: (r) => [r.payment?.screenshotMatchCode ?? ""] },
  surveyScore: { headers: ["AI Survey Score"], values: (_r, survey) => [survey ? `${survey.score}/${survey.outOf}` : ""] },
  surveyAnswers: {
    headers: DEBATE_SURVEY_QUESTIONS.map((q) => `Survey: ${q.prompt}`),
    values: (_r, survey) => DEBATE_SURVEY_QUESTIONS.map((_, i) => survey?.answers[i]?.answer ?? ""),
  },
  surveyTopic: { headers: ["Survey: Topic to debate"], values: (_r, survey) => [survey?.topic ?? ""] },
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

/**
 * Builds a CSV of registrations matching the admin filters, one row per
 * registration, with the chosen fields in their standard order (all of them
 * when none are chosen).
 */
export async function exportRegistrationsCsv(
  filters: Omit<RegistrationFilters, "page" | "pageSize">,
  fields: readonly ExportFieldKey[] = EXPORT_FIELD_KEYS,
): Promise<string> {
  const chosen = new Set(fields.length ? fields : EXPORT_FIELD_KEYS);
  const keys = EXPORT_FIELD_KEYS.filter((k) => chosen.has(k));
  const plain = keys.filter((k): k is Exclude<ExportFieldKey, MemberFieldKey> => !isMemberField(k));
  const member = keys.filter(isMemberField);

  const rows = await prisma.registration.findMany({
    where: buildRegistrationWhere(filters),
    orderBy: { createdAt: "asc" },
    take: MAX_EXPORT_ROWS,
    include: exportInclude,
  });

  const header = plain.flatMap((k) => COLUMNS[k].headers);
  for (let i = 1; i <= MEMBER_SLOTS && member.length; i++) {
    header.push(...member.map((k) => `Member ${i} ${MEMBER_COLUMNS[k].label}`));
  }

  const data = rows.map((r) => {
    const survey = plain.some((k) => k.startsWith("survey")) ? reviewSurvey(r.survey) : null;
    const row: Cell[] = plain.flatMap((k) => COLUMNS[k].values(r, survey));
    for (let i = 0; i < MEMBER_SLOTS && member.length; i++) {
      const m = r.team?.members[i];
      row.push(...member.map((k) => (m ? MEMBER_COLUMNS[k].value(m) : "")));
    }
    return row;
  });

  return toCsv(header, data);
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
