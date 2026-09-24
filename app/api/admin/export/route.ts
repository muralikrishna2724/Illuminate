import { requireAdminApi } from "@/lib/auth/guards";
import { route } from "@/lib/http/respond";
import { registrationFiltersSchema } from "@/lib/validation/admin";
import { exportRegistrationsCsv } from "@/services/export-service";

/** GET /api/admin/export?event=&status=&q=&from=&to= → text/csv */
export const GET = route(async (request) => {
  await requireAdminApi(request);
  const params = Object.fromEntries(
    [...new URL(request.url).searchParams.entries()].filter(([, value]) => value !== ""),
  );
  const { page: _page, pageSize: _pageSize, ...filters } = registrationFiltersSchema.parse(params);
  const csv = await exportRegistrationsCsv(filters);

  const stamp = new Date().toISOString().slice(0, 10);
  const scope = filters.event ?? "all-events";
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="illuminate-registrations-${scope}-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
