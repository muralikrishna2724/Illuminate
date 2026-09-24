"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/Button";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { formatInr } from "@/lib/events/catalog";
import type { RegistrationDetail } from "@/types/domain";
import { formatDateTime } from "./format";
import { PaymentActions } from "./PaymentActions";
import { ScreenshotViewer } from "./ScreenshotViewer";

/** Slide-over with everything needed to decide on a payment, without leaving the list. */
export function RegistrationDetailPanel({
  open,
  detail,
  loading,
  error,
  busy,
  onClose,
  onVerify,
  onReject,
}: {
  open: boolean;
  detail: RegistrationDetail | null;
  loading: boolean;
  error: string | null;
  busy: "verify" | "reject" | null;
  onClose: () => void;
  onVerify: () => void;
  onReject: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="detail-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="ml-auto mr-0 h-dvh max-h-dvh w-full max-w-2xl border-l border-[var(--line-strong)] bg-[#0d0b0a] p-0 text-sand backdrop:bg-black/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs text-mist">{detail?.event.name ?? "Registration"}</p>
            <h2 id="detail-title" className="font-mono text-xl text-flare">
              {detail?.registrationId ?? "Loading…"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-mist hover:bg-white/5 hover:text-flare" aria-label="Close details">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-6">
          {loading && !detail && (
            <p className="flex items-center gap-2 text-mist">
              <Spinner /> Loading registration…
            </p>
          )}
          {error && (
            <p role="alert" className="text-[#f4a193]">
              {error}
            </p>
          )}

          {detail && (
            <div className="space-y-8">
              {/* Decision block first: amount, UTR, status, actions */}
              <section aria-label="Payment" className="rounded-xl border border-[var(--line-strong)] p-4">
                <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-mist">Amount</dt>
                    <dd className="mt-1 text-2xl font-semibold text-flare">{formatInr(detail.paymentDetail.amountInr)}</dd>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <dt className="text-xs text-mist">UTR / Transaction ID</dt>
                    <dd className="mt-1 select-all break-all font-mono text-lg text-flare">{detail.paymentDetail.utr}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-mist">Status</dt>
                    <dd className="mt-2">
                      <StatusBadge status={detail.paymentDetail.status} />
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <PaymentActions status={detail.paymentDetail.status} busy={busy} onVerify={onVerify} onReject={onReject} size="md" />
                </div>
                {detail.paymentDetail.status === "VERIFIED" && (
                  <p className="mt-3 text-xs text-mist">
                    Verified {formatDateTime(detail.paymentDetail.verifiedAt)} by {detail.paymentDetail.verifiedBy ?? "—"}
                  </p>
                )}
                {detail.paymentDetail.status === "REJECTED" && (
                  <p className="mt-3 text-xs text-mist">
                    Rejected {formatDateTime(detail.paymentDetail.rejectedAt)} by {detail.paymentDetail.rejectedBy ?? "—"}
                    {detail.paymentDetail.rejectionReason ? ` · “${detail.paymentDetail.rejectionReason}”` : ""}
                  </p>
                )}
              </section>

              <ScreenshotViewer src={detail.paymentDetail.screenshot.url} registrationId={detail.registrationId} />

              {detail.team && (
                <section aria-labelledby="team-heading">
                  <h3 id="team-heading" className="text-sm text-mist">
                    Team
                  </h3>
                  <p className="mt-1 text-xl text-flare">{detail.team.name}</p>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="College" value={detail.team.college} />
                    <Info label="Leader" value={detail.team.leaderName} />
                    <Info label="Leader email" value={detail.team.leaderEmail} />
                    <Info label="Leader phone" value={detail.team.leaderPhone} />
                  </dl>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--line)]">
                    <table className="w-full min-w-[36rem] text-sm">
                      <caption className="sr-only">Team members</caption>
                      <thead className="text-left text-xs text-mist">
                        <tr className="border-b border-[var(--line)]">
                          <th scope="col" className="px-3 py-2 font-normal">#</th>
                          <th scope="col" className="px-3 py-2 font-normal">Name</th>
                          <th scope="col" className="px-3 py-2 font-normal">Email</th>
                          <th scope="col" className="px-3 py-2 font-normal">Phone</th>
                          <th scope="col" className="px-3 py-2 font-normal">Dept · Year</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.team.members.map((m) => (
                          <tr key={m.position} className="border-b border-[var(--line)] last:border-0">
                            <td className="px-3 py-2 text-mist">{m.position}</td>
                            <td className="px-3 py-2 text-flare">{m.name}</td>
                            <td className="px-3 py-2 break-all">{m.email}</td>
                            <td className="px-3 py-2">{m.phone}</td>
                            <td className="px-3 py-2">
                              {m.department} · {m.year}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {detail.participant && (
                <section aria-labelledby="participant-heading">
                  <h3 id="participant-heading" className="text-sm text-mist">
                    Participant
                  </h3>
                  <p className="mt-1 text-xl text-flare">{detail.participant.fullName}</p>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <Info label="Email" value={detail.participant.email} />
                    <Info label="Phone" value={detail.participant.phone} />
                    <Info label="College" value={detail.participant.college} />
                    <Info label="Department" value={detail.participant.department} />
                    <Info label="Year" value={detail.participant.year} />
                  </dl>
                </section>
              )}

              <section aria-labelledby="meta-heading">
                <h3 id="meta-heading" className="text-sm text-mist">
                  Record
                </h3>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Submitted" value={formatDateTime(detail.createdAt)} />
                  <Info label="Last updated" value={formatDateTime(detail.updatedAt)} />
                </dl>
                {detail.auditLog.length > 0 && (
                  <ol className="mt-4 space-y-2 text-xs text-mist">
                    {detail.auditLog.map((log, i) => (
                      <li key={i}>
                        {formatDateTime(log.createdAt)} — {log.adminName ?? "Admin"}: {log.previousStatus} → {log.newStatus}
                        {log.reason ? ` (“${log.reason}”)` : ""}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-mist">{label}</dt>
      <dd className="mt-0.5 break-words text-sand">{value}</dd>
    </div>
  );
}
