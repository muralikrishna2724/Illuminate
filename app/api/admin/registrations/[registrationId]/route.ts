import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { getRegistrationDetail } from "@/services/admin-registration-service";

export const GET = route<{ registrationId: string }>(async (request, { params }) => {
  await requireAdminApi(request);
  const { registrationId } = await params;
  return ok(await getRegistrationDetail(registrationId));
});
