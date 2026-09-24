import { requireAdminApi } from "@/lib/auth/guards";
import { route } from "@/lib/http/respond";
import { getPaymentScreenshot } from "@/services/payment-service";

/**
 * Streams a private payment screenshot to an authenticated admin.
 * Screenshots are never publicly addressable: storage is private and this
 * route is the only way to read them.
 */
export const GET = route<{ paymentId: string }>(async (request, { params }) => {
  await requireAdminApi(request);
  const { paymentId } = await params;
  const object = await getPaymentScreenshot(paymentId);
  return new Response(Buffer.from(object.body), {
    status: 200,
    headers: {
      "Content-Type": object.contentType,
      "Content-Length": String(object.body.byteLength),
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
});
