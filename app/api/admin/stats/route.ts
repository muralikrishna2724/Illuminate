import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { getDashboardStats } from "@/services/admin-registration-service";

export const GET = route(async (request) => {
  await requireAdminApi(request);
  return ok(await getDashboardStats());
});
