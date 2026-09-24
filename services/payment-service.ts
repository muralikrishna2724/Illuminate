import "server-only";
import type { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { conflict, notFound } from "@/lib/http/errors";
import { getStorage, type StoredObject } from "@/lib/storage";
import type { AdminUser, Payment } from "@/types/domain";
import { toPaymentDto } from "./mappers";

/**
 * Allowed transitions. Admins decide with a button — never by typing a status.
 *   VERIFY: PENDING → VERIFIED (or REJECTED → VERIFIED to correct a mistake)
 *   REJECT: PENDING → REJECTED (or VERIFIED → REJECTED to correct a mistake)
 */
const VERIFY_FROM: PaymentStatus[] = ["PENDING", "REJECTED"];
const REJECT_FROM: PaymentStatus[] = ["PENDING", "VERIFIED"];

const paymentInclude = {
  verifiedBy: { select: { name: true } },
  rejectedBy: { select: { name: true } },
} as const;

async function loadPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: paymentInclude });
  if (!payment) throw notFound("Payment not found.");
  return payment;
}

export async function verifyPayment(paymentId: string, admin: AdminUser): Promise<Payment> {
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({ where: { id: paymentId }, select: { status: true } });
    if (!current) throw notFound("Payment not found.");

    // Conditional update: guards against two admins acting on the same payment concurrently.
    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: VERIFY_FROM } },
      data: {
        status: "VERIFIED",
        verifiedAt: now,
        verifiedById: admin.id,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      },
    });
    if (result.count === 0) throw conflict("This payment has already been verified.");

    await tx.paymentAuditLog.create({
      data: { paymentId, adminId: admin.id, action: "VERIFY", previousStatus: current.status, newStatus: "VERIFIED" },
    });
    return tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: paymentInclude });
  });
  return toPaymentDto(updated);
}

export async function rejectPayment(paymentId: string, admin: AdminUser, reason: string | null): Promise<Payment> {
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.payment.findUnique({ where: { id: paymentId }, select: { status: true } });
    if (!current) throw notFound("Payment not found.");

    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: { in: REJECT_FROM } },
      data: {
        status: "REJECTED",
        verifiedAt: null,
        verifiedById: null,
        rejectedAt: now,
        rejectedById: admin.id,
        rejectionReason: reason,
      },
    });
    if (result.count === 0) throw conflict("This payment has already been rejected.");

    await tx.paymentAuditLog.create({
      data: {
        paymentId,
        adminId: admin.id,
        action: "REJECT",
        previousStatus: current.status,
        newStatus: "REJECTED",
        reason,
      },
    });
    return tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: paymentInclude });
  });
  return toPaymentDto(updated);
}

/** Reads the private screenshot for an authenticated admin. */
export async function getPaymentScreenshot(paymentId: string): Promise<StoredObject> {
  const payment = await loadPayment(paymentId);
  const object = await getStorage().download(payment.screenshotPath);
  if (!object) throw notFound("Screenshot not found in storage.");
  return { body: object.body, contentType: payment.screenshotMimeType };
}
