import { requireAdminApi } from "@/lib/auth/guards";
import { route } from "@/lib/http/respond";
import { screenshotThumbnail } from "@/lib/images/thumbnail";
import { getPaymentScreenshot } from "@/services/payment-service";

/**
 * Streams a private payment screenshot to an authenticated admin.
 * Screenshots are never publicly addressable: storage is private and this
 * route is the only way to read them.
 *
 * `?size=thumb` returns a small WebP for the registrations table. A payment's
 * screenshot never changes, so thumbnails may sit in the admin's own browser
 * cache for a while (`private`: never in a shared cache); the full image is not cached.
 */
export const GET = route<{ paymentId: string }>(async (request, { params }) => {
  await requireAdminApi(request);
  const { paymentId } = await params;
  const object = await getPaymentScreenshot(paymentId);

  const wantsThumb = new URL(request.url).searchParams.get("size") === "thumb";
  const thumb = wantsThumb ? await screenshotThumbnail(object.body) : null;
  const body = thumb ?? object.body;

  return new Response(Buffer.from(body), {
    status: 200,
    headers: {
      "Content-Type": thumb ? "image/webp" : object.contentType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": thumb ? "private, max-age=3600" : "private, no-store, max-age=0",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
    },
  });
});
