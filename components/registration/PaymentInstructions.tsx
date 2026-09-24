import { Placeholder } from "@/components/ui/Container";
import { formatInr } from "@/lib/events/catalog";
import { PLACEHOLDERS, type PaymentConfig } from "@/lib/site-config";

/**
 * Shows the amount and how to pay. Payment details that the organisers have
 * not configured yet are rendered as clearly marked placeholders.
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
  const configured = Boolean(payment.upiId);
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

      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
        <ol className="space-y-3 text-sand/90">
          <li className="flex gap-3">
            <span className="text-gold">1.</span>
            <span>
              Pay exactly <strong className="font-medium text-flare">{formatInr(amountInr)}</strong> by UPI to{" "}
              {configured ? (
                <strong className="select-all font-medium text-flare">{payment.upiId}</strong>
              ) : (
                <Placeholder>{PLACEHOLDERS.upiId}</Placeholder>
              )}
              {payment.payeeName ? (
                <>
                  {" "}
                  (<span className="text-flare">{payment.payeeName}</span>)
                </>
              ) : !configured ? (
                <>
                  {" "}
                  (<Placeholder>{PLACEHOLDERS.payeeName}</Placeholder>)
                </>
              ) : null}
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">2.</span>
            <span>Note the UTR / transaction ID shown in your payment app and take a screenshot of the successful payment.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-gold">3.</span>
            <span>Enter the UTR and upload the screenshot below, then submit.</span>
          </li>
        </ol>

        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--line-strong)] bg-black/40 text-center">
          {payment.qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- organiser-supplied QR, may be external
            <img src={payment.qrImageUrl} alt="UPI QR code for payment" className="h-full w-full bg-white object-contain p-2" />
          ) : (
            <span className="px-3 text-xs text-gold/80">QR_CODE_PLACEHOLDER</span>
          )}
        </div>
      </div>

      {!configured && (
        <p className="mt-6 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold/90">
          Payment details have not been published yet. Please wait for the organisers to share the official UPI ID before paying.
        </p>
      )}
    </div>
  );
}
