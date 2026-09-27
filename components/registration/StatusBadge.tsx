import type { PaymentStatus } from "@/types/domain";

const STYLES: Record<PaymentStatus, string> = {
  PENDING: "border-amber-300/40 bg-amber-300/10 text-warn",
  VERIFIED: "border-emerald-300/40 bg-emerald-300/10 text-ok",
  REJECTED: "border-red-300/40 bg-red-400/10 text-bad",
};

export function StatusBadge({ status, className = "" }: { status: PaymentStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${STYLES[status]} ${className}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
