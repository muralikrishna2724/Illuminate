import type { EventSlug } from "@/types/domain";

/** Deja Vu Hackathon themes. Every team picks one. */
export const HACKATHON_THEMES = [
  { value: "AGENTIC_AI", label: "Agentic AI" },
  { value: "HARDWARE_EMBEDDED", label: "Hardware and Embedded Systems" },
  { value: "CAMPUS_SOLVE", label: "CampusSolve" },
] as const;

export type HackathonTheme = (typeof HACKATHON_THEMES)[number]["value"];

export const HACKATHON_THEME_VALUES = HACKATHON_THEMES.map((t) => t.value) as [HackathonTheme, ...HackathonTheme[]];

/** The only event whose teams choose a theme. */
export const THEMED_EVENT_SLUG: EventSlug = "hackathon";

export const THEME_REQUIRED_MESSAGE = "Please choose a theme for your team.";

export function themeLabel(value: string | null | undefined): string | null {
  return HACKATHON_THEMES.find((t) => t.value === value)?.label ?? null;
}
