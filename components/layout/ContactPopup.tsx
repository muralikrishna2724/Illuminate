"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT_CONTACTS, isPlaceholder } from "@/lib/site-config";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
}

/** "Contact us" button that opens a small dialog listing the organisers' names and phone numbers. */
export function ContactPopup({ className = "" }: { className?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`inline-flex items-center gap-2 text-sand/80 transition-colors hover:text-flare ${className}`}
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden="true">
          <path
            d="M3.5 2h2l1 3-1.5 1a8 8 0 0 0 5 5l1-1.5 3 1v2a1.5 1.5 0 0 1-1.5 1.5A11 11 0 0 1 2 3.5 1.5 1.5 0 0 1 3.5 2Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
        Contact us
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="contact-title"
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[var(--line-strong)] bg-[#0d0b0a] p-0 text-sand shadow-2xl shadow-black/60 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 id="contact-title" className="font-display text-2xl text-flare">
            Contact us
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-full p-1.5 text-mist hover:bg-white/5 hover:text-flare"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="divide-y divide-[var(--line)]">
          {EVENT_CONTACTS.map((person, i) => {
            const dialable = !isPlaceholder(person.phone);
            return (
              <li key={i} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-flare">{person.name}</p>
                  {person.role && <p className="truncate text-xs text-mist">{person.role}</p>}
                  <p className="mt-0.5 text-sm text-mist">{dialable ? formatPhone(person.phone) : person.phone}</p>
                </div>
                {dialable && (
                  <a
                    href={`tel:+91${person.phone.replace(/\D/g, "").slice(-10)}`}
                    className="inline-flex h-9 shrink-0 items-center rounded-full bg-flare px-4 text-sm font-medium text-void hover:bg-gold"
                    aria-label={`Call ${person.name}`}
                  >
                    Call
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </dialog>
    </>
  );
}
