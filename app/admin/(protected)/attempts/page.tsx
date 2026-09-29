import type { Metadata } from "next";
import Link from "next/link";
import { EVENT_LIST, EVENTS } from "@/lib/events/catalog";
import { formatPhone } from "@/lib/site-config";
import { listAttempts } from "@/services/attempt-service";
import type { EventSlug } from "@/types/domain";

export const metadata: Metadata = { title: "Failed attempts" };

const REASONS: Record<string, string> = {
  VALIDATION_ERROR: "Form errors",
  DUPLICATE_UTR: "UTR already used",
  INVALID_FILE: "Invalid screenshot",
  PAYLOAD_TOO_LARGE: "Screenshot too large",
  REGISTRATION_CLOSED: "Registration closed",
  RATE_LIMITED: "Too many tries",
  NETWORK_ERROR: "Connection lost",
  SERVER_ERROR: "Server error",
  BLOCKED_IN_BROWSER: "Blocked by form checks",
  NOT_FOUND: "Event not found",
};

const when = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default async function FailedAttemptsPage({ searchParams }: PageProps<"/admin/attempts">) {
  const { event } = await searchParams;
  const selected = typeof event === "string" && event in EVENTS ? (event as EventSlug) : null;
  const attempts = await listAttempts({ event: selected });
  const unresolved = attempts.filter((a) => !a.registeredAs).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium text-flare">Failed registration attempts</h1>
        <p className="mt-1 max-w-3xl text-sm text-mist">
          Submissions that didn’t go through, newest first — use these to match payments from people who paid but couldn’t finish.
          “Registered later” shows a registration for the same event with the same email, phone or UTR.
        </p>
      </div>

      <nav aria-label="Filter by event" className="flex flex-wrap gap-2">
        {[{ slug: null, name: "All events" }, ...EVENT_LIST.map((e) => ({ slug: e.slug, name: e.shortName }))].map((item) => {
          const active = item.slug === selected;
          return (
            <Link
              key={item.slug ?? "all"}
              href={item.slug ? `/admin/attempts?event=${item.slug}` : "/admin/attempts"}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                active ? "border-flare bg-flare text-void" : "border-[var(--line-strong)] text-sand hover:text-flare"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <p className="text-sm text-sand">
        {attempts.length} attempt{attempts.length === 1 ? "" : "s"} · <span className="text-warn">{unresolved} not registered yet</span>
      </p>

      {attempts.length === 0 ? (
        <p className="rounded-2xl border border-[var(--line)] p-8 text-mist">No failed attempts recorded.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="bg-night text-xs text-mist">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">When (IST)</th>
                <th scope="col" className="px-4 py-3 font-medium">Event</th>
                <th scope="col" className="px-4 py-3 font-medium">What went wrong</th>
                <th scope="col" className="px-4 py-3 font-medium">Person</th>
                <th scope="col" className="px-4 py-3 font-medium">UTR</th>
                <th scope="col" className="px-4 py-3 font-medium">Screenshot</th>
                <th scope="col" className="px-4 py-3 font-medium">Registered later</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {attempts.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-sand">{when.format(new Date(a.createdAt))}</td>
                  <td className="px-4 py-3 text-sand">{EVENTS[a.eventSlug as EventSlug]?.shortName ?? a.eventSlug}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-flare">{REASONS[a.reason] ?? a.reason}</p>
                    <p className="mt-0.5 text-xs text-mist">{a.source === "BROWSER" ? "Reported by the browser" : "Rejected by the server"}</p>
                    {a.fieldErrors && (
                      <ul className="mt-1.5 space-y-0.5 text-xs text-bad">
                        {Object.entries(a.fieldErrors).map(([field, error]) => (
                          <li key={field}>
                            <span className="text-mist">{field}:</span> {error}
                          </li>
                        ))}
                      </ul>
                    )}
                    {!a.fieldErrors && a.message && <p className="mt-1.5 text-xs text-bad">{a.message}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-flare">{a.contactName ?? "—"}</p>
                    {a.contactEmail && <p className="break-all text-xs text-mist">{a.contactEmail}</p>}
                    {a.contactPhone && <p className="text-xs text-mist">{formatPhone(a.contactPhone)}</p>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-sand">{a.utr ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-mist">
                    {a.screenshotType || a.screenshotSize !== null ? (
                      <>
                        {a.screenshotType}
                        {a.screenshotType && a.screenshotSize !== null ? " · " : ""}
                        {formatBytes(a.screenshotSize)}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.registeredAs ? (
                      <span className="rounded-full border border-ok/40 bg-ok/10 px-2.5 py-1 text-xs font-medium text-ok">{a.registeredAs}</span>
                    ) : (
                      <span className="rounded-full border border-warn/40 bg-warn/10 px-2.5 py-1 text-xs font-medium text-warn">Not yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
