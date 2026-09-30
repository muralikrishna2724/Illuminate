import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { adminThemeSchema } from "@/lib/validation/admin";
import { setTeamTheme } from "@/services/admin-registration-service";

/** PUT { theme } — organisers set or change a Deja Vu team's theme. */
export const PUT = route<{ registrationId: string }>(async (request, { params }) => {
  await requireAdminApi(request);
  const { registrationId } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const { theme } = adminThemeSchema.parse(body ?? {});
  return ok(await setTeamTheme(registrationId, theme));
});
