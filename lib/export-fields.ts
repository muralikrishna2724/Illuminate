import type { EventSlug } from "@/types/domain";

/**
 * Fields organisers can pick for a CSV export. Shared by the admin export
 * picker and the server (services/export-service.ts), which maps each key to
 * its column(s). Order here is the column order in the file.
 */

export const EXPORT_GROUPS = ["Registration", "Contact", "Team", "Team members", "Payment", "AI survey"] as const;
export type ExportGroup = (typeof EXPORT_GROUPS)[number];

export interface ExportField {
  key: string;
  label: string;
  group: ExportGroup;
  /** Events the field means something for; omitted = every event. */
  events?: readonly EventSlug[];
}

const TEAM_EVENTS: readonly EventSlug[] = ["hackathon"];
const INDIVIDUAL_EVENTS: readonly EventSlug[] = ["debate", "ipl-auction", "illuminate"];
const SURVEY_EVENTS: readonly EventSlug[] = ["debate"];

export const EXPORT_FIELDS = [
  { key: "registrationId", label: "Registration ID", group: "Registration" },
  { key: "event", label: "Event", group: "Registration" },
  { key: "day", label: "Day", group: "Registration" },
  { key: "name", label: "Participant / team name", group: "Registration" },
  { key: "theme", label: "Theme", group: "Team", events: TEAM_EVENTS },
  { key: "college", label: "College", group: "Contact" },
  { key: "contactName", label: "Contact name (team leader for teams)", group: "Contact" },
  { key: "email", label: "Email", group: "Contact" },
  { key: "phone", label: "Phone", group: "Contact" },
  { key: "department", label: "Department", group: "Contact", events: INDIVIDUAL_EVENTS },
  { key: "year", label: "Year", group: "Contact", events: INDIVIDUAL_EVENTS },
  { key: "utr", label: "UTR", group: "Payment" },
  { key: "amount", label: "Amount (INR)", group: "Payment" },
  { key: "status", label: "Payment status", group: "Payment" },
  { key: "createdAt", label: "Registered at (IST)", group: "Registration" },
  { key: "verifiedAt", label: "Verified at (IST)", group: "Payment" },
  { key: "verifiedBy", label: "Verified by", group: "Payment" },
  { key: "rejectedAt", label: "Rejected at (IST)", group: "Payment" },
  { key: "rejectedBy", label: "Rejected by", group: "Payment" },
  { key: "rejectionReason", label: "Rejection reason", group: "Payment" },
  { key: "screenshotMatch", label: "Screenshot same as", group: "Payment" },
  { key: "surveyScore", label: "AI survey score", group: "AI survey", events: SURVEY_EVENTS },
  { key: "surveyAnswers", label: "AI survey answers", group: "AI survey", events: SURVEY_EVENTS },
  { key: "surveyTopic", label: "Topic to debate", group: "AI survey", events: SURVEY_EVENTS },
  { key: "memberName", label: "Member names", group: "Team members", events: TEAM_EVENTS },
  { key: "memberEmail", label: "Member emails", group: "Team members", events: TEAM_EVENTS },
  { key: "memberPhone", label: "Member phones", group: "Team members", events: TEAM_EVENTS },
  { key: "memberDepartment", label: "Member departments", group: "Team members", events: TEAM_EVENTS },
  { key: "memberYear", label: "Member years", group: "Team members", events: TEAM_EVENTS },
] as const satisfies readonly ExportField[];

export type ExportFieldKey = (typeof EXPORT_FIELDS)[number]["key"];

export const EXPORT_FIELD_KEYS: readonly ExportFieldKey[] = EXPORT_FIELDS.map((f) => f.key);

export function isExportFieldKey(value: string): value is ExportFieldKey {
  return (EXPORT_FIELD_KEYS as readonly string[]).includes(value);
}

/** The fields worth offering for one event (all of them when no event is chosen). */
export function exportFieldsFor(event: EventSlug | null | undefined): readonly ExportField[] {
  return EXPORT_FIELDS.filter((f) => !event || !("events" in f) || (f.events as readonly EventSlug[]).includes(event));
}
