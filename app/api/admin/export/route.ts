import { requireAdminApi } from "@/lib/auth/guards";
import { isExportFieldKey } from "@/lib/export-fields";
import { badRequest } from "@/lib/http/errors";
import { route } from "@/lib/http/respond";
import { registrationFiltersSchema } from "@/lib/validation/admin";
import { exportRegistrationsCsv, exportTeamContactsCsv } from "@/services/export-service";

/**
 * GET /api/admin/export?event=&status=&q=&from=&to= → text/csv
 * `format=team-contacts` exports only team name and team leader phone (team events).
 * `fields=registrationId,name,phone` limits the columns (see lib/export-fields.ts); omitted = all.
 */
export const GET = route(async (request) => {
  await requireAdminApi(request);
  const { format, fields: fieldsParam, ...params } = Object.fromEntries(
    [...new URL(request.url).searchParams.entries()].filter(([, value]) => value !== ""),
  );
  const { page: _page, pageSize: _pageSize, ...filters } = registrationFiltersSchema.parse(params);
  const teamContacts = format === "team-contacts";
  const fields = fieldsParam ? fieldsParam.split(",").map((f) => f.trim()).filter(Boolean) : [];
  const unknown = fields.filter((f) => !isExportFieldKey(f));
  if (unknown.length) throw badRequest(`Unknown export field: ${unknown.join(", ")}`);
  const csv = teamContacts ? await exportTeamContactsCsv(filters) : await exportRegistrationsCsv(filters, fields.filter(isExportFieldKey));

  const stamp = new Date().toISOString().slice(0, 10);
  const scope = `${filters.event ?? "all-events"}${teamContacts ? "-team-contacts" : ""}`;
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="innoventra-registrations-${scope}-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
