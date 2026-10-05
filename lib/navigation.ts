import { EVENT_LIST } from "@/lib/events/catalog";

export interface NavItem {
  href: string;
  label: string;
  /** Shown as a dropdown under this item in the header. */
  children?: ReadonlyArray<{ href: string; label: string; hint?: string }>;
}

export const MAIN_NAV: ReadonlyArray<NavItem> = [
  { href: "/", label: "Home" },
  {
    href: "/schedule",
    label: "Schedule",
    children: [
      { href: "/schedule", label: "Full schedule", hint: "October 9–10" },
      { href: "/day-1", label: "Day 1", hint: "October 9 · Deja Vu, Mind x Machine, IPL Auction" },
      { href: "/day-2", label: "Day 2", hint: "October 10 · Illuminate Workshop" },
    ],
  },
  { href: "/faq", label: "FAQ" },
];

/** Every page link, sub-items included (for the footer). */
export const FLAT_NAV = MAIN_NAV.flatMap((item) =>
  item.children ? item.children.map((c) => ({ href: c.href, label: c.label === "Full schedule" ? "Schedule" : c.label })) : [item],
);

export const EVENT_NAV = EVENT_LIST.map((e) => ({
  href: e.day === 1 ? `/day-1#${e.slug}` : "/day-2",
  label: e.slug === "illuminate" ? "Illuminate Workshop" : e.name,
}));

/** One login for participants and organisers; it routes each to their own dashboard. */
export const LOGIN = { href: "/login", label: "Login" } as const;
