"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Spinner } from "@/components/ui/Button";
import { StatusBadge } from "@/components/registration/StatusBadge";
import { adminApi, type RegistrationQuery } from "@/lib/api/admin";
import { formatInr } from "@/lib/events/catalog";
import type { EventSlug, Paginated, Payment, PaymentStatus, RegistrationDetail, RegistrationSummary } from "@/types/domain";
import { formatDateTime } from "./format";
import { PaymentActions } from "./PaymentActions";
import { RegistrationDetailPanel } from "./RegistrationDetailPanel";
import { RejectDialog } from "./RejectDialog";

const EVENT_OPTIONS: Array<{ value: EventSlug; label: string }> = [
  { value: "hackathon", label: "Deja Vu Hackathon" },
  { value: "debate", label: "AI Debate" },
  { value: "ipl-auction", label: "IPL Auction" },
  { value: "illuminate", label: "Illuminate Workshop" },
];

const STATUS_OPTIONS: Array<{ value: PaymentStatus | ""; label: string }> = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

type Busy = { paymentId: string; action: "verify" | "reject" } | null;

export function RegistrationsManager({
  fixedEvent,
  defaultStatus = "",
  title,
}: {
  fixedEvent?: EventSlug;
  defaultStatus?: PaymentStatus | "";
  title: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [event, setEvent] = useState<EventSlug | "">(fixedEvent ?? "");
  const [status, setStatus] = useState<PaymentStatus | "">(defaultStatus);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<{ key: string; data: Paginated<RegistrationSummary> | null; error: string | null }>({
    key: "",
    data: null,
    error: null,
  });

  const [busy, setBusy] = useState<Busy>(null);
  const [announcement, setAnnouncement] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RegistrationSummary | null>(null);
  const [exporting, setExporting] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RegistrationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Debounce free-text search.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  /** Every filter change starts again from page 1. */
  const withPageReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };
  const changeEvent = withPageReset(setEvent);
  const changeStatus = withPageReset(setStatus);
  const changeFrom = withPageReset(setFrom);
  const changeTo = withPageReset(setTo);

  const query: RegistrationQuery = {
    q: debouncedSearch || undefined,
    event: (fixedEvent ?? event) || undefined,
    status: status || undefined,
    from: from || undefined,
    to: to || undefined,
  };
  const queryKey = JSON.stringify(query);
  const requestKey = `${queryKey}|${page}|${reloadKey}`;
  const loading = result.key !== requestKey;
  const data = result.data;
  const error = loading ? null : result.error;

  useEffect(() => {
    const controller = new AbortController();
    const [q, p] = requestKey.split("|");
    adminApi.listRegistrations({ ...(JSON.parse(q ?? "{}") as RegistrationQuery), page: Number(p), pageSize: 25 }, controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      if (!res.ok && res.error.code === "UNAUTHORIZED") {
        router.replace("/admin/login");
        return;
      }
      setResult((prev) => ({
        key: requestKey,
        data: res.ok ? res.data : prev.data,
        error: res.ok ? null : res.error.message,
      }));
    });
    return () => controller.abort();
  }, [requestKey, router]);

  const setData = (update: (d: Paginated<RegistrationSummary> | null) => Paginated<RegistrationSummary> | null) =>
    setResult((prev) => ({ ...prev, data: update(prev.data) }));

  const loadDetail = useCallback(async (registrationId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    const res = await adminApi.getRegistration(registrationId);
    setDetailLoading(false);
    if (res.ok) setDetail(res.data);
    else setDetailError(res.error.message);
  }, []);

  const openDetail = (registrationId: string) => {
    setOpenId(registrationId);
    setDetail(null);
    void loadDetail(registrationId);
  };

  const applyPayment = (registrationId: string, payment: Payment) => {
    setData((d) =>
      d
        ? {
            ...d,
            items: d.items.map((item) =>
              item.registrationId === registrationId
                ? {
                    ...item,
                    payment: {
                      ...item.payment,
                      status: payment.status,
                      verifiedAt: payment.verifiedAt,
                      rejectionReason: payment.rejectionReason,
                    },
                  }
                : item,
            ),
          }
        : d,
    );
    setDetail((current) =>
      current && current.registrationId === registrationId
        ? { ...current, payment: { ...current.payment, status: payment.status }, paymentDetail: payment }
        : current,
    );
    if (openId === registrationId) void loadDetail(registrationId); // refresh audit log
    router.refresh(); // refresh server-rendered dashboard counts
  };

  const verify = async (row: Pick<RegistrationSummary, "registrationId" | "payment">) => {
    if (busy) return;
    setActionError(null);
    setBusy({ paymentId: row.payment.id, action: "verify" });
    const res = await adminApi.verifyPayment(row.payment.id);
    setBusy(null);
    if (res.ok) {
      applyPayment(row.registrationId, res.data);
      setAnnouncement(`${row.registrationId} marked VERIFIED.`);
    } else {
      setActionError(`${row.registrationId}: ${res.error.message}`);
      setReloadKey((k) => k + 1);
    }
  };

  const confirmReject = async (reason: string): Promise<string | null> => {
    const row = rejectTarget;
    if (!row) return null;
    setBusy({ paymentId: row.payment.id, action: "reject" });
    const res = await adminApi.rejectPayment(row.payment.id, reason);
    setBusy(null);
    if (res.ok) {
      applyPayment(row.registrationId, res.data);
      setAnnouncement(`${row.registrationId} marked REJECTED.`);
      setRejectTarget(null);
      return null;
    }
    setReloadKey((k) => k + 1);
    return res.error.message;
  };

  const exportCsv = async () => {
    setExporting(true);
    setActionError(null);
    const { page: _p, ...filters } = { ...query, page };
    const res = await adminApi.exportCsv(filters);
    setExporting(false);
    if (!res.ok) setActionError(res.error.message);
    else setAnnouncement(`Exported ${res.data.filename}.`);
  };

  const busyFor = (paymentId: string) => (busy?.paymentId === paymentId ? busy.action : null);
  const hasFilters = Boolean(search || (!fixedEvent && event) || status || from || to);

  return (
    <section aria-labelledby="registrations-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="registrations-title" className="text-xl font-medium text-flare">
            {title}
          </h2>
          <p className="mt-1 text-sm text-mist" aria-live="polite">
            {data ? `${data.total} registration${data.total === 1 ? "" : "s"}` : "Loading…"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
            Refresh
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={exportCsv} loading={exporting}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 rounded-2xl border border-[var(--line)] p-4 md:grid-cols-2 xl:grid-cols-[2fr_1fr_auto_1fr_1fr]">
        <div>
          <label htmlFor="reg-search" className="mb-1 block text-xs text-mist">
            Search
          </label>
          <input
            id="reg-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ID, team, name, phone, email, college, UTR"
            className="field-input py-2 text-sm"
          />
        </div>
        {!fixedEvent && (
          <div>
            <label htmlFor="reg-event" className="mb-1 block text-xs text-mist">
              Event
            </label>
            <select id="reg-event" value={event} onChange={(e) => changeEvent(e.target.value as EventSlug | "")} className="field-input py-2 text-sm">
              <option value="">All events</option>
              {EVENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <fieldset className={fixedEvent ? "md:col-span-1 xl:col-span-2" : ""}>
          <legend className="mb-1 block text-xs text-mist">Payment status</legend>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value || "all"}
                type="button"
                aria-pressed={status === o.value}
                onClick={() => changeStatus(o.value)}
                className={`h-10 rounded-full px-3.5 text-sm transition-colors ${
                  status === o.value ? "bg-flare text-void" : "border border-[var(--line-strong)] text-mist hover:text-flare"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="reg-from" className="mb-1 block text-xs text-mist">
            Registered from
          </label>
          <input id="reg-from" type="date" value={from} max={to || undefined} onChange={(e) => changeFrom(e.target.value)} className="field-input py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="reg-to" className="mb-1 block text-xs text-mist">
            Registered to
          </label>
          <input id="reg-to" type="date" value={to} min={from || undefined} onChange={(e) => changeTo(e.target.value)} className="field-input py-2 text-sm" />
        </div>
      </div>
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            if (!fixedEvent) setEvent("");
            setStatus("");
            setFrom("");
            setTo("");
            setPage(1);
          }}
          className="text-sm text-mist underline underline-offset-4 hover:text-flare"
        >
          Clear filters
        </button>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {actionError && (
        <p role="alert" className="rounded-xl border border-[#f08b7a]/50 bg-[#f08b7a]/10 px-4 py-3 text-sm text-[#f7b3a7]">
          {actionError}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-[#f08b7a]/50 bg-[#f08b7a]/10 px-4 py-3 text-sm text-[#f7b3a7]">
          {error}
        </p>
      )}

      {/* Table (laptop and up) */}
      <div className="relative hidden overflow-x-auto rounded-2xl border border-[var(--line)] lg:block">
        <table className="w-full min-w-[64rem] text-sm">
          <caption className="sr-only">{title}</caption>
          <thead className="text-left text-xs text-mist">
            <tr className="border-b border-[var(--line)]">
              <th scope="col" className="px-4 py-3 font-normal">Registration</th>
              {!fixedEvent && <th scope="col" className="px-4 py-3 font-normal">Event</th>}
              <th scope="col" className="px-4 py-3 font-normal">Participant / Team</th>
              <th scope="col" className="px-4 py-3 text-right font-normal">Amount</th>
              <th scope="col" className="px-4 py-3 font-normal">UTR</th>
              <th scope="col" className="px-4 py-3 font-normal">Screenshot</th>
              <th scope="col" className="px-4 py-3 font-normal">Status</th>
              <th scope="col" className="px-4 py-3 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((row) => (
              <tr key={row.registrationId} className="border-b border-[var(--line)] align-middle last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => openDetail(row.registrationId)} className="whitespace-nowrap font-mono text-flare underline-offset-4 hover:underline">
                    {row.registrationId}
                  </button>
                  <p className="text-xs text-smoke">{formatDateTime(row.createdAt)}</p>
                </td>
                {!fixedEvent && <td className="px-4 py-3 text-sand">{row.event.name}</td>}
                <td className="max-w-[16rem] px-4 py-3">
                  <p className="truncate text-flare">{row.displayName}</p>
                  <p className="truncate text-xs text-mist">
                    {row.college} · {row.contactPhone}
                  </p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-flare">{formatInr(row.payment.amountInr)}</td>
                <td className="px-4 py-3 font-mono text-sand">{row.payment.utr}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => openDetail(row.registrationId)}
                    className="block h-12 w-12 overflow-hidden rounded-md border border-[var(--line-strong)] bg-black hover:border-gold/60"
                    aria-label={`View payment screenshot for ${row.registrationId}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- private, cookie-authenticated thumbnail */}
                    <img src={row.payment.screenshotUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.payment.status} />
                </td>
                <td className="px-4 py-3">
                  <PaymentActions
                    status={row.payment.status}
                    busy={busyFor(row.payment.id)}
                    onVerify={() => verify(row)}
                    onReject={() => setRejectTarget(row)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Spinner className="h-6 w-6 text-gold" />
          </div>
        )}
        {!loading && data?.items.length === 0 && <p className="p-8 text-center text-mist">No registrations match these filters.</p>}
      </div>

      {/* Cards (phone / tablet) */}
      <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
        {loading && !data && (
          <li className="flex justify-center p-6 md:col-span-2">
            <Spinner className="h-6 w-6 text-gold" />
          </li>
        )}
        {data?.items.map((row) => (
          <li key={row.registrationId} className="rounded-2xl border border-[var(--line)] p-4">
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => openDetail(row.registrationId)} className="text-left">
                <span className="block font-mono text-flare">{row.registrationId}</span>
                <span className="block text-sm text-sand">{row.displayName}</span>
                <span className="block text-xs text-mist">{row.event.name}</span>
              </button>
              <StatusBadge status={row.payment.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-mist">Amount</dt>
                <dd className="text-flare">{formatInr(row.payment.amountInr)}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist">UTR</dt>
                <dd className="break-all font-mono text-sand">{row.payment.utr}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => openDetail(row.registrationId)} className="text-sm text-mist underline underline-offset-4">
                View screenshot &amp; details
              </button>
              <PaymentActions status={row.payment.status} busy={busyFor(row.payment.id)} onVerify={() => verify(row)} onReject={() => setRejectTarget(row)} />
            </div>
          </li>
        ))}
        {!loading && data?.items.length === 0 && <li className="p-6 text-center text-mist md:col-span-2">No registrations match these filters.</li>}
      </ul>

      {data && data.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-sm">
          <Button type="button" variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-mist">
            Page {data.page} of {data.totalPages}
          </span>
          <Button type="button" variant="secondary" size="sm" disabled={page >= data.totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </nav>
      )}

      <RegistrationDetailPanel
        open={openId !== null}
        detail={detail}
        loading={detailLoading}
        error={detailError}
        busy={detail ? busyFor(detail.paymentDetail.id) : null}
        onClose={() => {
          setOpenId(null);
          setDetail(null);
        }}
        onVerify={() => detail && verify(detail)}
        onReject={() => detail && setRejectTarget(detail)}
      />

      <RejectDialog
        target={
          rejectTarget
            ? { registrationId: rejectTarget.registrationId, amountLabel: formatInr(rejectTarget.payment.amountInr), utr: rejectTarget.payment.utr }
            : null
        }
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
      />
    </section>
  );
}
