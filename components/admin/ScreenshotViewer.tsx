"use client";

import { useState } from "react";

/**
 * Authenticated screenshot viewer with fit/zoom toggle and open-in-new-tab.
 * Render it with `key={paymentId}` so switching registrations mounts a fresh
 * image: browsers otherwise keep painting the previous picture until the new
 * one has loaded, which can show one registration's screenshot under another.
 */
export function ScreenshotViewer({ src, registrationId }: { src: string; registrationId: string }) {
  const [zoomed, setZoomed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm text-mist">Payment screenshot</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            aria-pressed={zoomed}
            className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs text-sand hover:text-flare"
          >
            {zoomed ? "Fit to panel" : "Zoom 100%"}
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-[var(--line-strong)] px-3 py-1 text-xs text-sand hover:text-flare"
          >
            Open in new tab
          </a>
        </div>
      </div>
      <div className={`relative mt-3 overflow-auto rounded-xl border border-[var(--line)] bg-black ${zoomed ? "max-h-[75vh]" : ""}`}>
        {!loaded && !failed && (
          <p role="status" className="absolute inset-0 flex min-h-40 items-center justify-center text-sm text-mist">
            Loading screenshot for {registrationId}…
          </p>
        )}
        {failed ? (
          <p className="p-6 text-sm text-bad">The screenshot could not be loaded. Try opening it in a new tab.</p>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- private, cookie-authenticated image; must not go through the public image optimiser
          <img
            src={src}
            alt={`Payment screenshot for ${registrationId}`}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            onClick={() => setZoomed((z) => !z)}
            className={`${zoomed ? "max-w-none cursor-zoom-out" : "mx-auto max-h-[60vh] w-full cursor-zoom-in object-contain"} ${
              loaded ? "" : "min-h-40 opacity-0"
            }`}
          />
        )}
      </div>
    </div>
  );
}
