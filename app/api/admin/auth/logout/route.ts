import { forbidden } from "@/lib/http/errors";
import { ok, route } from "@/lib/http/respond";
import { isSameOrigin } from "@/lib/http/request";
import { destroyAdminSession } from "@/lib/auth/session";

export const POST = route(async (request) => {
  if (!isSameOrigin(request)) throw forbidden("Cross-origin request blocked.");
  await destroyAdminSession();
  return ok({ signedOut: true });
});
