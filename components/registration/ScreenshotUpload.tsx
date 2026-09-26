"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ACCEPTED_SCREENSHOT_EXTENSIONS, ACCEPTED_SCREENSHOT_TYPES } from "@/lib/site-config";
import { validateScreenshotClientSide } from "@/lib/validation/file";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Payment screenshot picker: drag & drop or browse, with preview, file name,
 * size, remove and replace. Validates type/size in the browser; the server
 * re-validates the actual file contents.
 */
export function ScreenshotUpload({
  file,
  onChange,
  error,
  onError,
  disabled,
  progress,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  onError: (message: string | undefined) => void;
  disabled?: boolean;
  /** 0..1 while uploading */
  progress?: number | null;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pick = (candidate: File | undefined | null) => {
    if (!candidate) return;
    const problem = validateScreenshotClientSide(candidate);
    if (problem) {
      onError(problem);
      return;
    }
    onError(undefined);
    onChange(candidate);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div>
      <p id={`${inputId}-label`} className="mb-2 block text-sm text-sand">
        Payment screenshot
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name="screenshot"
        accept={[...ACCEPTED_SCREENSHOT_TYPES, ...ACCEPTED_SCREENSHOT_EXTENSIONS].join(",")}
        className="sr-only"
        aria-labelledby={`${inputId}-label`}
        aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) pick(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center transition-colors ${
            error ? "border-[#f08b7a]" : dragging ? "border-gold bg-gold/5" : "border-[var(--line-strong)]"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-mist" fill="none" aria-hidden="true">
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sand">
            Drag your screenshot here, or{" "}
            <button type="button" onClick={openPicker} disabled={disabled} className="text-flare underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
              browse
            </button>
          </p>
          <p id={`${inputId}-hint`} className="text-xs text-smoke">
            JPG, JPEG, PNG or WEBP · up to 4 MB
          </p>
        </div>
      ) : (
        <div className={`overflow-hidden rounded-2xl border ${error ? "border-[#f08b7a]" : "border-[var(--line-strong)]"}`}>
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not optimisable
              <img
                src={previewUrl}
                alt="Preview of your payment screenshot"
                className="h-40 w-full rounded-xl bg-black object-contain sm:h-28 sm:w-28"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-flare" title={file.name}>
                {file.name}
              </p>
              <p className="mt-1 text-sm text-mist">{formatBytes(file.size)}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={openPicker}
                  disabled={disabled}
                  className="rounded-full border border-[var(--line-strong)] px-4 py-1.5 text-sm text-sand hover:border-gold/60 hover:text-flare disabled:opacity-50"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    onError(undefined);
                  }}
                  disabled={disabled}
                  className="rounded-full px-4 py-1.5 text-sm text-mist hover:text-flare disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          {typeof progress === "number" && (
            <div className="border-t border-[var(--line)] px-4 py-3">
              <div className="flex justify-between text-xs text-mist">
                <span>{progress < 1 ? "Uploading screenshot…" : "Upload complete — saving registration…"}</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div
                className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="Screenshot upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
              >
                <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-sm text-[#f4a193]">
          {error}
        </p>
      )}
    </div>
  );
}
