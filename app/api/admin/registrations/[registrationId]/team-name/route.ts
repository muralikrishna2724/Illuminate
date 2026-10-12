import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { adminTeamNameSchema } from "@/lib/validation/admin";
import { setTeamName } from "@/services/admin-registration-service";

/** PUT { name } — organisers rename a Deja Vu team. */
export const PUT = route<{ registrationId: string }>(async (request, { params }) => {
  await requireAdminApi(request);
  const { registrationId } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const { name } = adminTeamNameSchema.parse(body ?? {});
  return ok(await setTeamName(registrationId, name));
});
