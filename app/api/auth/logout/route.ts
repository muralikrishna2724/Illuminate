import { forbidden } from "@/lib/http/errors";
import { ok, route } from "@/lib/http/respond";
import { isSameOrigin } from "@/lib/http/request";
import { logoutEveryone } from "@/services/auth-service";

export const POST = route(async (request) => {
  if (!isSameOrigin(request)) throw forbidden("Cross-origin request blocked.");
  await logoutEveryone();
  return ok({ signedOut: true });
});
