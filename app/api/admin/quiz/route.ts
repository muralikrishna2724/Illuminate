import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { getQuizConfig, updateQuizConfig } from "@/services/quiz-service";

export const GET = route(async (request) => {
  await requireAdminApi(request);
  return ok(await getQuizConfig());
});

const save = route(async (request) => {
  const admin = await requireAdminApi(request);
  const body: unknown = await request.json().catch(() => null);
  return ok(await updateQuizConfig(body, admin.id));
});

/** POST and PUT both upsert the single Deja Vu quiz configuration. */
export const POST = save;
export const PUT = save;
