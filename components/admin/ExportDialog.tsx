"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { EXPORT_GROUPS, exportFieldLabel, exportFieldsFor, type ExportFieldKey, type ExportRowMode } from "@/lib/export-fields";
import type { EventSlug } from "@/types/domain";

export interface ExportChoice {
  format: "csv" | "pdf";
  fields: ExportFieldKey[];
  rows: ExportRowMode;
  cvrOnly: boolean;
}

interface Saved {
  rows: ExportRowMode;
  cvrOnly: boolean;
  fields: Partial<Record<ExportRowMode, ExportFieldKey[]>>;
}

const storageKey = (event: EventSlug | null) => `innoventra-export:${event ?? "all"}`;

function loadSaved(event: EventSlug | null): Saved | null {
  try {
    const raw = window.localStorage.getItem(storageKey(event));
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function save(event: EventSlug | null, value: Saved) {
  try {
    window.localStorage.setItem(storageKey(event), JSON.stringify(value));
  } catch {
    // Remembering the choice is a convenience only.
  }
}

const keysFor = (event: EventSlug | null, rows: ExportRowMode) => exportFieldsFor(event, rows).map((f) => f.key as ExportFieldKey);

/** Lets organisers pick the columns, rows and format of an export. Remembers the last choice per event. */
export function ExportDialog({
  open,
  event,
  total,
  onClose,
  onExport,
}: {
  open: boolean;
  /** The event being exported, or null for all events. */
  event: EventSlug | null;
  /** Registrations matching the current filters, if known. */
  total: number | null;
  onClose: () => void;
  onExport: (choice: ExportChoice) => Promise<string | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<ExportRowMode>("registrations");
  const [cvrOnly, setCvrOnly] = useState(false);
  const [selected, setSelected] = useState<Set<ExportFieldKey>>(() => new Set(keysFor(event, "registrations")));
  const [remembered, setRemembered] = useState<Saved["fields"]>({});
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const fields = useMemo(() => exportFieldsFor(event, rows), [event, rows]);
  const allKeys = useMemo(() => fields.map((f) => f.key as ExportFieldKey), [fields]);
  // Only team events have anyone to split out.
  const canSplit = event === null || event === "hackathon";

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const saved = loadSaved(event);
      const layout = saved?.rows === "students" && canSplit ? "students" : "registrations";
      const allowed = keysFor(event, layout);
      const savedKeys = saved?.fields?.[layout]?.filter((k) => allowed.includes(k));
      setRows(layout);
      setCvrOnly(saved?.cvrOnly ?? false);
      setRemembered(saved?.fields ?? {});
      setSelected(new Set(savedKeys?.length ? savedKeys : allowed));
      setError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, event, canSplit]);

  const switchRows = (next: ExportRowMode) => {
    if (next === rows) return;
    const allowed = keysFor(event, next);
    const savedKeys = remembered[next]?.filter((k) => allowed.includes(k));
    // Carry over what still applies, so switching layouts doesn't lose the selection.
    const carried = allowed.filter((k) => selected.has(k) || (k === "teamName" && next === "students"));
    setRows(next);
    setSelected(new Set(savedKeys?.length ? savedKeys : carried.length ? carried : allowed));
  };

  const toggle = (key: ExportFieldKey) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const run = async (format: "csv" | "pdf") => {
    if (exporting || selected.size === 0) return;
    const keys = allKeys.filter((k) => selected.has(k));
    setExporting(format);
    setError(null);
    const problem = await onExport({ format, fields: keys, rows, cvrOnly });
    setExporting(null);
    if (problem) {
      setError(problem);
      return;
    }
    save(event, { rows, cvrOnly, fields: { ...remembered, [rows]: keys } });
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run("csv");
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby="export-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!exporting) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line-strong)] bg-night p-0 text-sand backdrop:bg-void/80 backdrop:backdrop-blur-sm"
    >
      {open && (
        <form onSubmit={submit} className="p-6">
          <h2 id="export-title" className="text-lg font-medium text-flare">
            Export
          </h2>
          <p className="mt-1 text-sm text-mist">
            Choose the rows and columns to include, then download a CSV or a PDF. The export uses the filters currently applied
            {total !== null ? ` (${total} registration${total === 1 ? "" : "s"})` : ""}.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {canSplit && (
              <fieldset>
                <legend className="text-xs font-medium tracking-[0.12em] text-gold uppercase">Rows</legend>
                <div className="mt-2 space-y-1.5 text-sm">
                  <label className="flex items-center gap-2.5">
                    <input type="radio" name="export-rows" checked={rows === "registrations"} onChange={() => switchRows("registrations")} className="h-4 w-4 accent-[var(--color-gold)]" />
                    One row per registration (team)
                  </label>
                  <label className="flex items-center gap-2.5">
                    <input type="radio" name="export-rows" checked={rows === "students"} onChange={() => switchRows("students")} className="h-4 w-4 accent-[var(--color-gold)]" />
                    One row per student (each team member)
                  </label>
                </div>
              </fieldset>
            )}
            <fieldset>
              <legend className="text-xs font-medium tracking-[0.12em] text-gold uppercase">College</legend>
              <label className="mt-2 flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={cvrOnly} onChange={(e) => setCvrOnly(e.target.checked)} className="h-4 w-4 accent-[var(--color-gold)]" />
                Only CVR College of Engineering
              </label>
              <p className="mt-1 text-xs text-smoke">Matches every spelling: CVR, cvr college, CVR College of Engineering…</p>
            </fieldset>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-4 text-sm">
            <span className="mr-1 text-xs font-medium tracking-[0.12em] text-gold uppercase">Columns</span>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set(allKeys))}>
              Select all
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <span className="text-mist" aria-live="polite">
              {selected.size} of {allKeys.length} selected
            </span>
          </div>

          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            {EXPORT_GROUPS.map((group) => {
              const inGroup = fields.filter((f) => f.group === group);
              if (inGroup.length === 0) return null;
              return (
                <fieldset key={group}>
                  <legend className="text-xs font-medium text-mist">{group}</legend>
                  <ul className="mt-2 space-y-1.5">
                    {inGroup.map((f) => {
                      const id = `export-field-${f.key}`;
                      return (
                        <li key={f.key} className="flex items-center gap-2.5">
                          <input
                            id={id}
                            type="checkbox"
                            checked={selected.has(f.key as ExportFieldKey)}
                            onChange={() => toggle(f.key as ExportFieldKey)}
                            className="h-4 w-4 accent-[var(--color-gold)]"
                          />
                          <label htmlFor={id} className="text-sm text-sand">
                            {exportFieldLabel(f, rows)}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-bad">
              {error}
            </p>
          )}
          <p className="mt-5 text-xs text-smoke">The PDF adds an S.No column and reads best with a handful of columns.</p>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={exporting !== null}>
              Cancel
            </Button>
            <Button type="button" variant="secondary" loading={exporting === "pdf"} disabled={selected.size === 0 || exporting !== null} onClick={() => void run("pdf")}>
              {exporting === "pdf" ? "Exporting…" : "Download PDF"}
            </Button>
            <Button type="submit" loading={exporting === "csv"} disabled={selected.size === 0 || exporting !== null}>
              {exporting === "csv" ? "Exporting…" : "Download CSV"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
