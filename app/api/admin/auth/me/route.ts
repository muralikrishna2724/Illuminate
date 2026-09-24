import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";

export const GET = route(async (request) => {
  const admin = await requireAdminApi(request);
  return ok({ admin });
});
