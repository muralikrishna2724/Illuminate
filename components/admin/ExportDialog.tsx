"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { EXPORT_GROUPS, exportFieldsFor, type ExportFieldKey } from "@/lib/export-fields";
import type { EventSlug } from "@/types/domain";

const storageKey = (event: EventSlug | null) => `innoventra-export-fields:${event ?? "all"}`;

function loadSaved(event: EventSlug | null, allowed: readonly ExportFieldKey[]): ExportFieldKey[] | null {
  try {
    const raw = window.localStorage.getItem(storageKey(event));
    if (!raw) return null;
    const saved = (JSON.parse(raw) as unknown[]).filter((k): k is ExportFieldKey => allowed.includes(k as ExportFieldKey));
    return saved.length ? saved : null;
  } catch {
    return null;
  }
}

function save(event: EventSlug | null, keys: readonly ExportFieldKey[]) {
  try {
    window.localStorage.setItem(storageKey(event), JSON.stringify(keys));
  } catch {
    // Remembering the choice is a convenience only.
  }
}

/** Lets organisers pick which columns go into the CSV export. Remembers the last choice per event. */
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
  onExport: (fields: ExportFieldKey[]) => Promise<string | null>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const fields = useMemo(() => exportFieldsFor(event), [event]);
  const allKeys = useMemo(() => fields.map((f) => f.key as ExportFieldKey), [fields]);
  const [selected, setSelected] = useState<Set<ExportFieldKey>>(() => new Set(allKeys));
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelected(new Set(loadSaved(event, allKeys) ?? allKeys));
      setError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, event, allKeys]);

  const toggle = (key: ExportFieldKey) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (exporting || selected.size === 0) return;
    const keys = allKeys.filter((k) => selected.has(k));
    setExporting(true);
    setError(null);
    const problem = await onExport(keys);
    setExporting(false);
    if (problem) {
      setError(problem);
      return;
    }
    save(event, keys);
    onClose();
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
            Export CSV
          </h2>
          <p className="mt-1 text-sm text-mist">
            Choose the columns to include. The export uses the filters currently applied
            {total !== null ? ` (${total} registration${total === 1 ? "" : "s"})` : ""}.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
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

          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {EXPORT_GROUPS.map((group) => {
              const inGroup = fields.filter((f) => f.group === group);
              if (inGroup.length === 0) return null;
              return (
                <fieldset key={group}>
                  <legend className="text-xs font-medium tracking-[0.12em] text-gold uppercase">{group}</legend>
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
                            {f.label}
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
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={exporting}>
              Cancel
            </Button>
            <Button type="submit" loading={exporting} disabled={selected.size === 0}>
              {exporting ? "Exporting…" : "Download CSV"}
            </Button>
          </div>
        </form>
      )}
    </dialog>
  );
}
