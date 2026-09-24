import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { registrationFiltersSchema } from "@/lib/validation/admin";
import { listRegistrations } from "@/services/admin-registration-service";

/** GET /api/admin/registrations?event=&status=&q=&from=&to=&page=&pageSize= */
export const GET = route(async (request) => {
  await requireAdminApi(request);
  const params = Object.fromEntries(
    [...new URL(request.url).searchParams.entries()].filter(([, value]) => value !== ""),
  );
  const filters = registrationFiltersSchema.parse(params);
  return ok(await listRegistrations(filters));
});
