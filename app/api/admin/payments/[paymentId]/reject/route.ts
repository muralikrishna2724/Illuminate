import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { rejectPaymentSchema } from "@/lib/validation/admin";
import { rejectPayment } from "@/services/payment-service";

/** Sets paymentStatus = REJECTED with an optional reason; clears verifiedAt. */
export const POST = route<{ paymentId: string }>(async (request, { params }) => {
  const admin = await requireAdminApi(request);
  const { paymentId } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  const { reason } = rejectPaymentSchema.parse(body ?? {});
  return ok(await rejectPayment(paymentId, admin, reason));
});
