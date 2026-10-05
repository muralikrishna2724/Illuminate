"use client";

import { useRef, useState } from "react";

/** A long ID shown in full, with a one-tap copy button (hard to type by hand). */
export function CopyableId({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState<"yes" | "failed" | null>(null);
  const textRef = useRef<HTMLElement>(null);
  const labelId = `copyable-${value}`;

  const selectText = () => {
    const node = textRef.current;
    const selection = window.getSelection();
    if (!node || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied("yes");
    } catch {
      // Some in-app browsers block the clipboard: select the ID so it can be copied by hand.
      selectText();
      setCopied("failed");
    }
    window.setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div>
      <p id={labelId} className="text-sm text-mist">
        {label}
      </p>
      <div className="mt-2 flex flex-col gap-3 rounded-xl border border-gold/60 bg-powder/30 px-4 py-3 sm:flex-row sm:items-center">
        <code ref={textRef} aria-labelledby={labelId} className="min-w-0 flex-1 select-all break-all font-mono text-base text-flare sm:text-lg sm:tracking-wide">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-flare px-5 text-sm font-medium text-void transition-colors hover:bg-gold"
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
            {copied === "yes" ? (
              <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <>
                <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" stroke="currentColor" strokeWidth="1.4" />
              </>
            )}
          </svg>
          {copied === "yes" ? "Copied" : "Copy ID"}
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-1.5 min-h-5 text-sm text-mist">
        {copied === "yes" && "Quiz ID copied. Paste it on the quiz page."}
        {copied === "failed" && "Couldn't copy automatically. The ID is selected; copy it from your browser menu."}
      </p>
    </div>
  );
}
