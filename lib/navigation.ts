import { EVENT_LIST } from "@/lib/events/catalog";

export const MAIN_NAV = [
  { href: "/", label: "Home" },
  { href: "/day-1", label: "Day 1" },
  { href: "/day-2", label: "Day 2" },
  { href: "/schedule", label: "Schedule" },
  { href: "/faq", label: "FAQ" },
] as const;

export const EVENT_NAV = EVENT_LIST.map((e) => ({
  href: e.day === 1 ? `/day-1#${e.slug}` : "/day-2",
  label: e.slug === "illuminate" ? "Illuminate Workshop" : e.name,
}));

export const ADMIN_LOGIN = { href: "/admin/login", label: "Admin Login" } as const;
