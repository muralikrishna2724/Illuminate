import { Placeholder } from "@/components/ui/Container";
import { formatInr } from "@/lib/events/catalog";
import { PLACEHOLDERS, type PaymentConfig } from "@/lib/site-config";

/**
 * Shows the amount and how to pay. Payment is by scanning the organisers' UPI
 * QR. Anything the organisers have not configured is shown as a clearly
 * marked placeholder.
 */
export function PaymentInstructions({
  amountInr,
  breakdown,
  payment,
}: {
  amountInr: number;
  breakdown: string;
  payment: PaymentConfig;
}) {
  const configured = Boolean(payment.qrImageUrl || payment.upiId);
  const payee = payment.payeeName ? (
    <strong className="font-medium text-flare">{payment.payeeName}</strong>
  ) : (
    <Placeholder>{PLACEHOLDERS.payeeName}</Placeholder>
  );

  return (
    <div className="rounded-2xl border border-[var(--line-strong)] bg-white/[0.02] p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-mist">Registration amount</p>
          <p className="mt-1 font-display text-5xl text-flare">{formatInr(amountInr)}</p>
          <p className="mt-1 text-sm text-mist">{breakdown}</p>
        </div>
        <p className="max-w-[16rem] text-xs text-smoke">The amount is set by the event and checked again by our server.</p>
      </div>

      <div className="divider-glow my-6" />

      <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <ol className="space-y-3 text-sand/90">
          <li className="flex gap-3">
            <span className="text-gold">1.</span>
            <span>
              Scan the QR with any UPI app (PhonePe, Google Pay, Paytm, BHIM…) and pay exactly{" "}
              <strong className="font-medium text-flare">{formatInr(amountInr)}</strong> to {payee}.
              {payment.upiId && (
                <>
                  {" "}
                  UPI ID: <strong className="select-all font-medium text-flare">{payment.upiId}</strong>.
                </>
              )}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">2.</span>
            <span>Check that the payee name in your UPI app matches before you pay.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">3.</span>
            <span>Note the UTR / transaction ID shown in your payment app and take a screenshot of the successful payment.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">4.</span>
            <span>Enter the UTR and upload the screenshot below, then submit.</span>
          </li>
        </ol>

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-56 w-56 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 sm:h-60 sm:w-60">
            {payment.qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- organiser QR; must stay pixel-exact for scanning
              <img
                src={payment.qrImageUrl}
                alt={`UPI QR code to pay ${formatInr(amountInr)}${payment.payeeName ? ` to ${payment.payeeName}` : ""}`}
                width={240}
                height={240}
                className="h-full w-full object-contain [image-rendering:pixelated]"
              />
            ) : (
              <span className="px-3 text-center text-xs text-void/70">QR_CODE_PLACEHOLDER</span>
            )}
          </div>
          {payment.payeeName && <p className="max-w-60 text-center text-xs text-mist">Pays {payment.payeeName}</p>}
          {payment.qrImageUrl && (
            <a
              href={payment.qrImageUrl}
              download="illuminate-upi-qr.png"
              className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--line-strong)] px-4 text-sm text-sand transition-colors hover:border-gold/60 hover:text-flare"
            >
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
                <path d="M8 2v8m0 0 3-3M8 10 5 7M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Save QR
            </a>
          )}
          {payment.qrImageUrl && (
            <p className="max-w-60 text-center text-xs text-smoke md:hidden">
              Paying from this phone? Save the QR, then open your UPI app&apos;s scanner and pick it from your gallery.
            </p>
          )}
        </div>
      </div>

      {!configured && (
        <p className="mt-6 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold/90">
          Payment details have not been published yet. Please wait for the organisers to share the official UPI details before paying.
        </p>
      )}
    </div>
  );
}
