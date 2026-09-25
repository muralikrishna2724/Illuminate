"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { firstName, initials } from "@/lib/names";
import type { Viewer } from "@/types/domain";

/** Avatar + name button with a small menu (profile / dashboard, log out). */
export function ProfileMenu({ viewer }: { viewer: NonNullable<Viewer> }) {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = async () => {
    setLoggingOut(true);
    await authApi.logout();
    setOpen(false);
    setLoggingOut(false);
    router.replace("/");
    router.refresh();
  };

  const homeHref = viewer.role === "admin" ? "/admin/dashboard" : "/dashboard";
  const homeLabel = viewer.role === "admin" ? "Admin dashboard" : "My profile & registrations";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-2 rounded-full border border-[var(--line-strong)] py-1 pl-1 pr-3.5 text-sm text-flare transition-colors hover:border-gold/60"
      >
        <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-flare text-xs font-semibold text-void">
          {initials(viewer.name)}
        </span>
        <span className="max-w-[9rem] truncate">{firstName(viewer.name)}</span>
        <span className="sr-only">— open account menu</span>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[#0d0b0a] shadow-2xl shadow-black/60"
        >
          <div className="border-b border-[var(--line)] px-4 py-3">
            <p className="truncate text-sm text-flare">{viewer.name}</p>
            <p className="truncate text-xs text-mist">{viewer.email}</p>
          </div>
          <Link
            role="menuitem"
            href={homeHref}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-sm text-sand hover:bg-white/5 hover:text-flare"
          >
            {homeLabel}
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 border-t border-[var(--line)] px-4 py-3 text-left text-sm text-mist hover:bg-white/5 hover:text-flare disabled:opacity-50"
          >
            {loggingOut && <Spinner className="h-3.5 w-3.5" />}
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
