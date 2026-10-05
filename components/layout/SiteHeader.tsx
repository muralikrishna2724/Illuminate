"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LOGIN, MAIN_NAV, type NavItem } from "@/lib/navigation";
import { buttonClasses } from "@/components/ui/Button";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ProfileMenu } from "@/components/auth/ProfileMenu";
import { initials } from "@/lib/names";
import type { Viewer } from "@/types/domain";

/** `viewer` comes from the server layout: when someone is signed in, Login becomes their profile menu. */
export function SiteHeader({ viewer }: { viewer: Viewer }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const isItemActive = (item: NavItem) => isActive(item.href) || Boolean(item.children?.some((c) => isActive(c.href)));

  return (
    <header
      className={`theme-dark fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-500 ${
        scrolled || open ? "border-b border-[var(--line)] bg-void/90 backdrop-blur-md" : "border-b border-transparent bg-void"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-flare focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="font-display text-2xl tracking-tight text-flare" onClick={() => setOpen(false)}>
          Innoventra
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {MAIN_NAV.map((item) =>
            item.children ? (
              <NavDropdown key={item.href} item={item} active={isItemActive(item)} isActive={isActive} pathname={pathname} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
                  isActive(item.href) ? "text-flare" : "text-mist hover:text-flare"
                }`}
              >
                {item.label}
              </Link>
            ),
          )}
          {viewer ? (
            <div className="ml-3">
              <ProfileMenu viewer={viewer} />
            </div>
          ) : (
            <Link
              href={LOGIN.href}
              aria-current={isActive(LOGIN.href) ? "page" : undefined}
              className={buttonClasses("secondary", "sm", "ml-3")}
            >
              {LOGIN.label}
            </Link>
          )}
          <Link href="/register" className={buttonClasses("primary", "sm", "ml-2")}>
            Register
          </Link>
        </nav>

        <button
          type="button"
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-flare md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Main" className="h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--line)] bg-void px-5 pb-10 pt-6 md:hidden">
          <ul className="space-y-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === item.href || (item.href !== "/" && !item.children && isActive(item.href)) ? "page" : undefined}
                  className={`block py-3 font-display text-4xl ${isItemActive(item) ? "text-flare" : "text-sand/80"}`}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <ul className="mb-2 ml-1 space-y-1 border-l border-[var(--line-strong)] pl-5">
                    {item.children
                      .filter((c) => c.href !== item.href)
                      .map((c) => (
                        <li key={c.href}>
                          <Link
                            href={c.href}
                            onClick={() => setOpen(false)}
                            aria-current={isActive(c.href) ? "page" : undefined}
                            className={`block py-2 font-display text-2xl ${isActive(c.href) ? "text-flare" : "text-sand/70"}`}
                          >
                            {c.label}
                            {c.hint && <span className="mt-0.5 block font-sans text-xs text-mist">{c.hint}</span>}
                          </Link>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-4">
            <Link href="/register" onClick={() => setOpen(false)} className={buttonClasses("primary", "lg")}>
              Register
            </Link>
            {viewer ? (
              <div className="rounded-2xl border border-[var(--line-strong)] p-4">
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-full bg-flare text-sm font-semibold text-void">
                    {initials(viewer.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-flare">{viewer.name}</p>
                    <p className="truncate text-xs text-mist">{viewer.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    href={viewer.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                    onClick={() => setOpen(false)}
                    className={buttonClasses("secondary", "sm")}
                  >
                    {viewer.role === "admin" ? "Admin dashboard" : "My profile & registrations"}
                  </Link>
                  <LogoutButton />
                </div>
              </div>
            ) : (
              <Link href={LOGIN.href} onClick={() => setOpen(false)} className={buttonClasses("secondary", "lg")}>
                {LOGIN.label}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

/** Desktop dropdown: opens on hover, click or keyboard; closes on Escape, outside click or choosing a link. */
function NavDropdown({
  item,
  active,
  isActive,
  pathname,
}: {
  item: NavItem;
  active: boolean;
  isActive: (href: string) => boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const menuId = `nav-${item.label.toLowerCase()}`;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      ref={ref}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm transition-colors ${
          active ? "text-flare" : "text-mist hover:text-flare"
        }`}
      >
        {item.label}
        <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" aria-hidden="true">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div id={menuId} className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2">
          <ul className="overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-void/95 p-2 shadow-2xl backdrop-blur-md">
            {item.children!.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  aria-current={pathname === c.href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-4 py-3 transition-colors hover:bg-powder/10 focus-visible:bg-powder/10 ${
                    isActive(c.href) && pathname === c.href ? "text-flare" : "text-sand"
                  }`}
                >
                  <span className="block text-sm font-medium">{c.label}</span>
                  {c.hint && <span className="mt-0.5 block text-xs text-mist">{c.hint}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
