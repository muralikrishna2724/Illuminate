import { requireAdminApi } from "@/lib/auth/guards";
import { isExportFieldKey } from "@/lib/export-fields";
import { badRequest } from "@/lib/http/errors";
import { route } from "@/lib/http/respond";
import { registrationFiltersSchema } from "@/lib/validation/admin";
import { exportRegistrationsCsv, exportRegistrationsPdf, exportTeamContactsCsv } from "@/services/export-service";

const FORMATS = ["csv", "pdf", "team-contacts"] as const;

/**
 * GET /api/admin/export?event=&status=&q=&from=&to= → text/csv
 * - `format=pdf` returns the same export as a PDF table; `format=team-contacts`
 *   only team name and team leader phone (team events).
 * - `fields=registrationId,name,phone` limits the columns (see lib/export-fields.ts); omitted = all.
 * - `rows=students` gives one row per student (each team member separately).
 * - `college=cvr` keeps only CVR College of Engineering registrations.
 */
export const GET = route(async (request) => {
  await requireAdminApi(request);
  const { format = "csv", fields: fieldsParam, rows, college, ...params } = Object.fromEntries(
    [...new URL(request.url).searchParams.entries()].filter(([, value]) => value !== ""),
  );
  const { page: _page, pageSize: _pageSize, ...filters } = registrationFiltersSchema.parse(params);
  if (!(FORMATS as readonly string[]).includes(format)) throw badRequest(`Unknown export format: ${format}`);
  if (rows && rows !== "students" && rows !== "registrations") throw badRequest(`Unknown row layout: ${rows}`);
  if (college && college !== "cvr") throw badRequest(`Unknown college filter: ${college}`);
  const fields = fieldsParam ? fieldsParam.split(",").map((f) => f.trim()).filter(Boolean) : [];
  const unknown = fields.filter((f) => !isExportFieldKey(f));
  if (unknown.length) throw badRequest(`Unknown export field: ${unknown.join(", ")}`);
  const options = { fields: fields.filter(isExportFieldKey), rows: rows === "students" ? ("students" as const) : undefined, cvrOnly: college === "cvr" };

  const stamp = new Date().toISOString().slice(0, 10);
  const scope = [filters.event ?? "all-events", format === "team-contacts" ? "team-contacts" : null, options.cvrOnly ? "cvr" : null, options.rows]
    .filter(Boolean)
    .join("-");
  const filename = `innoventra-registrations-${scope}-${stamp}.${format === "pdf" ? "pdf" : "csv"}`;
  const headers = { "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" };

  if (format === "pdf") {
    const pdf = await exportRegistrationsPdf(filters, options);
    return new Response(Buffer.from(pdf), { status: 200, headers: { ...headers, "Content-Type": "application/pdf" } });
  }
  const csv = format === "team-contacts" ? await exportTeamContactsCsv(filters) : await exportRegistrationsCsv(filters, options);
  return new Response(csv, { status: 200, headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
});
