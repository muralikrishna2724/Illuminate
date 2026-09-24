"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

/** Small confirmation dialog for REJECT, with an optional reason. */
export function RejectDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: { registrationId: string; amountLabel: string; utr: string } | null;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<string | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (target && !dialog.open) {
      setReason("");
      setError(null);
      dialog.showModal();
    } else if (!target && dialog.open) {
      dialog.close();
    }
  }, [target]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const problem = await onConfirm(reason);
    setLoading(false);
    if (problem) setError(problem);
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="reject-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!loading) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[var(--line-strong)] bg-[#110e0c] p-0 text-sand backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      {target && (
        <form onSubmit={submit} className="p-6">
          <h2 id="reject-title" className="text-lg font-medium text-flare">
            Reject payment for {target.registrationId}?
          </h2>
          <p className="mt-2 text-sm text-mist">
            {target.amountLabel} · UTR <span className="font-mono text-sand">{target.utr}</span>
          </p>
          <label htmlFor="reject-reason" className="mt-5 block text-sm text-sand">
            Reason <span className="text-smoke">(optional, shown to the registrant)</span>
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            maxLength={500}
            rows={3}
            onChange={(e) => setReason(e.target.value)}
            className="field-input mt-2 resize-y"
            placeholder="e.g. UTR not found in payment records"
          />
          {error && (
            <p role="alert" className="mt-3 text-sm text-[#f4a193]">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={loading}>
              {loading ? "Rejecting…" : "REJECT"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
