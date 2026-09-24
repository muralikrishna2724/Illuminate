import "server-only";
import type { Payment as PaymentRow } from "@prisma/client";
import type { Payment } from "@/types/domain";

export function screenshotUrl(paymentId: string): string {
  return `/api/admin/payments/${encodeURIComponent(paymentId)}/screenshot`;
}

export function toPaymentDto(
  row: PaymentRow & { verifiedBy: { name: string } | null; rejectedBy: { name: string } | null },
): Payment {
  return {
    id: row.id,
    amountInr: row.amountInr,
    utr: row.utr,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    verifiedBy: row.verifiedBy?.name ?? null,
    rejectedAt: row.rejectedAt?.toISOString() ?? null,
    rejectedBy: row.rejectedBy?.name ?? null,
    rejectionReason: row.rejectionReason,
    screenshot: { mimeType: row.screenshotMimeType, sizeBytes: row.screenshotSize, url: screenshotUrl(row.id) },
  };
}
