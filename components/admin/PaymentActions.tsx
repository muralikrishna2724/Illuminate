"use client";

import { Button } from "@/components/ui/Button";
import type { PaymentStatus } from "@/types/domain";

/**
 * VERIFY / REJECT buttons. The admin never types a status: the button
 * determines the transition and the server applies it.
 * For already-decided payments a smaller "change decision" control is shown.
 */
export function PaymentActions({
  status,
  busy,
  onVerify,
  onReject,
  size = "sm",
}: {
  status: PaymentStatus;
  busy: "verify" | "reject" | null;
  onVerify: () => void;
  onReject: () => void;
  size?: "sm" | "md";
}) {
  if (status === "PENDING") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="success" size={size} loading={busy === "verify"} disabled={busy !== null} onClick={onVerify}>
          VERIFY
        </Button>
        <Button type="button" variant="danger" size={size} loading={busy === "reject"} disabled={busy !== null} onClick={onReject}>
          REJECT
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-mist">
      <span>Change decision:</span>
      {status === "REJECTED" ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={onVerify}
          className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-200 hover:bg-emerald-300/10 disabled:opacity-50"
        >
          {busy === "verify" ? "Verifying…" : "Mark VERIFIED"}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy !== null}
          onClick={onReject}
          className="rounded-full border border-red-300/40 px-3 py-1 text-red-200 hover:bg-red-400/10 disabled:opacity-50"
        >
          {busy === "reject" ? "Rejecting…" : "Mark REJECTED"}
        </button>
      )}
    </div>
  );
}
