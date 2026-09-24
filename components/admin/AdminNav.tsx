"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/hackathon", label: "Deja Vu Hackathon" },
  { href: "/admin/debate", label: "AI Debate" },
  { href: "/admin/ipl-auction", label: "IPL Auction" },
  { href: "/admin/illuminate", label: "Illuminate Workshop" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${
              active ? "bg-flare text-void" : "text-mist hover:bg-white/5 hover:text-flare"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
