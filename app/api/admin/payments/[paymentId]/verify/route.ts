import { requireAdminApi } from "@/lib/auth/guards";
import { ok, route } from "@/lib/http/respond";
import { verifyPayment } from "@/services/payment-service";

/** Sets paymentStatus = VERIFIED, verifiedAt = now, verifiedBy = current admin. No status is accepted from the client. */
export const POST = route<{ paymentId: string }>(async (request, { params }) => {
  const admin = await requireAdminApi(request);
  const { paymentId } = await params;
  return ok(await verifyPayment(paymentId, admin));
});
