"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import { EVENT_YEAR_LABEL } from "@/lib/events/catalog";
import { ADMIN_LOGIN, EVENT_NAV, MAIN_NAV } from "@/lib/navigation";
import { PLACEHOLDERS, type ContactConfig } from "@/lib/site-config";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

/**
 * Cinematic footer:
 *  - GSAP ScrollTrigger entrance (the footer "rises" out of the dark)
 *  - giant background ILLUMINATE typography with scrubbed parallax
 *  - staggered content reveal
 *  - magnetic buttons (fine pointers only)
 *  - smooth back-to-top via ScrollToPlugin
 * All motion is gated behind `prefers-reduced-motion: no-preference`.
 */
export function CinematicFooter({ contact }: { contact: ContactConfig }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-footer-panel]", {
          yPercent: 12,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 35%", scrub: 0.8 },
        });

        gsap.fromTo(
          "[data-footer-giant]",
          { yPercent: 35, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top 85%", end: "bottom bottom", scrub: 1 },
          },
        );

        gsap.from("[data-footer-horizon]", {
          scaleX: 0.6,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 80%", end: "bottom bottom", scrub: 1 },
        });

        gsap.from("[data-footer-reveal]", {
          y: 28,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });
      });

      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const magnets = gsap.utils.toArray<HTMLElement>("[data-magnetic]");
        const cleanups = magnets.map((el) => {
          const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
          const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
          const move = (e: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            xTo((e.clientX - (rect.left + rect.width / 2)) * 0.35);
            yTo((e.clientY - (rect.top + rect.height / 2)) * 0.35);
          };
          const leave = () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
          };
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
          return () => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerleave", leave);
          };
        });
        return () => cleanups.forEach((fn) => fn());
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  const backToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.scrollTo({ top: 0 });
    } else {
      gsap.to(window, { scrollTo: { y: 0 }, duration: 1.4, ease: "power3.inOut" });
    }
    document.getElementById("main")?.focus({ preventScroll: true });
  };

  return (
    <footer ref={root} className="relative isolate overflow-hidden border-t border-[var(--line)] bg-void">
      {/* Horizon glow — the footer's own small accretion light */}
      <div
        aria-hidden="true"
        data-footer-horizon
        className="pointer-events-none absolute -bottom-[48vw] left-1/2 -z-10 h-[64vw] w-[150vw] -translate-x-1/2 rounded-[50%] sm:-bottom-[46vw]"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgb(255 244 228 / 0.2) 0%, rgb(230 205 170 / 0.09) 24%, rgb(120 100 80 / 0.04) 45%, transparent 65%)",
          boxShadow: "inset 0 1px 0 rgb(255 244 228 / 0.22)",
        }}
      />

      <div data-footer-panel className="mx-auto max-w-6xl px-5 pb-10 pt-24 sm:px-8 sm:pt-32">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p data-footer-reveal className="text-sm text-gold/90">
              {EVENT_YEAR_LABEL}
            </p>
            <h2 data-footer-reveal className="mt-4 font-display text-5xl leading-[0.95] text-flare sm:text-7xl">
              Two days. <span className="text-gold">One</span> pull.
            </h2>
            <p data-footer-reveal className="mt-5 max-w-md text-mist">
              Day 1 brings the Deja Vu Hackathon, AI Debate and IPL Auction. Day 2 is Illuminate — the Entrepreneurship Workshop.
            </p>
          </div>
          <div data-footer-reveal className="flex flex-wrap gap-3">
            <Magnetic>
              <Link
                href="/register"
                className="inline-flex h-14 items-center rounded-full bg-flare px-8 text-base font-medium text-void transition-colors hover:bg-gold"
              >
                Register now
              </Link>
            </Magnetic>
          </div>
        </div>

        <div className="divider-glow mt-16" />

        <div className="mt-12 grid grid-cols-2 gap-10 text-sm sm:grid-cols-4">
          <FooterColumn title="Navigate">
            {MAIN_NAV.map((l) => (
              <FooterLink key={l.href} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn title="Events">
            {EVENT_NAV.map((l) => (
              <FooterLink key={l.label} href={l.href}>
                {l.label}
              </FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn title="Contact">
            <li data-footer-reveal className="text-mist">
              {contact.email ? (
                <a className="hover:text-flare" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              ) : (
                <span title="Contact email not yet published">{PLACEHOLDERS.contactEmail}</span>
              )}
            </li>
            <li data-footer-reveal className="text-mist">
              {contact.phone ? (
                <a className="hover:text-flare" href={`tel:${contact.phone.replace(/\s/g, "")}`}>
                  {contact.phone}
                </a>
              ) : (
                <span title="Contact number not yet published">{PLACEHOLDERS.contactPhone}</span>
              )}
            </li>
            <FooterLink href="/registration">Check registration status</FooterLink>
          </FooterColumn>
          <FooterColumn title="Admin">
            <li data-footer-reveal>
              <Link href={ADMIN_LOGIN.href} className="text-smoke transition-colors hover:text-mist">
                {ADMIN_LOGIN.label}
              </Link>
            </li>
          </FooterColumn>
        </div>

        <div className="mt-16 flex items-center justify-between gap-6">
          <p data-footer-reveal className="text-xs text-smoke">
            © {new Date().getFullYear()} ILLUMINATE
          </p>
          <Magnetic>
            <button
              type="button"
              onClick={backToTop}
              className="group inline-flex h-12 items-center gap-2 rounded-full border border-[var(--line-strong)] px-5 text-sm text-sand transition-colors hover:border-gold/60 hover:text-flare"
            >
              Back to top
              <svg viewBox="0 0 16 16" className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" aria-hidden="true">
                <path d="M8 13V3M4 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Magnetic>
        </div>
      </div>

      {/* Giant background typography */}
      <div aria-hidden="true" className="pointer-events-none relative -mt-6 select-none overflow-hidden">
        <p
          data-footer-giant
          className="whitespace-nowrap text-center font-display text-[17vw] font-semibold leading-[0.85]"
          style={{
            backgroundImage: "linear-gradient(180deg, rgb(255 243 224 / 0.16) 0%, rgb(233 214 186 / 0.07) 55%, transparent 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Illuminate
        </p>
      </div>
    </footer>
  );
}

function Magnetic({ children }: { children: ReactNode }) {
  return (
    <span data-magnetic className="inline-block will-change-transform">
      {children}
    </span>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 data-footer-reveal className="text-xs font-medium text-smoke">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li data-footer-reveal>
      <Link href={href} className="text-sand/80 transition-colors hover:text-flare">
        {children}
      </Link>
    </li>
  );
}
