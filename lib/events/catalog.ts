import type { EventFormat, EventSlug } from "@/types/domain";

/**
 * Single source of truth for event information.
 *
 * - Public pages render from this catalog.
 * - `prisma/seed.ts` syncs the pricing / format fields into the `Event` table,
 *   and the backend always computes payable amounts from the database record.
 *
 * Only confirmed information lives here. Do not add timings, rules, judging
 * criteria, speaker names, prizes, or goodie contents until they are confirmed.
 */

export interface EventContent {
  slug: EventSlug;
  name: string;
  shortName: string;
  day: 1 | 2;
  /** ISO date, YYYY-MM-DD */
  date: string;
  dateLabel: string;
  format: EventFormat;
  teamSize: number;
  feePerPersonInr: number;
  tagline: string;
  description: string;
  /** Labelled lists of confirmed facts (themes, topics, benefits…). */
  highlights: Array<{ title: string; items: string[] }>;
  /** Confirmed notes shown as plain statements. */
  notes: string[];
  /** The organisation behind the event, e.g. "E-Cell IIT Bombay". */
  initiativeBy?: string;
  /** The event's own official tagline, when it has one. */
  motto?: string;
  registerPath: string;
  hasQualificationQuiz: boolean;
}

export const EVENT_YEAR_LABEL = "October 8–9";

export const EVENTS: Record<EventSlug, EventContent> = {
  hackathon: {
    slug: "hackathon",
    name: "Deja Vu Hackathon",
    shortName: "Deja Vu",
    day: 1,
    date: "2026-10-08",
    dateLabel: "October 8",
    format: "TEAM",
    teamSize: 4,
    feePerPersonInr: 50,
    tagline: "Real-world problems. Innovative technology solutions.",
    description:
      "Deja Vu is a problem-solving hackathon where teams tackle real-world challenges through innovative technology solutions. The competition brings together Agentic AI, intelligent and resilient networking, and real college problem statements, with the actual problem statements revealed at the venue.",
    highlights: [
      {
        title: "Themes",
        items: ["Agentic AI", "AI for Intelligent & Resilient Networks", "College Problem Statements"],
      },
    ],
    notes: [
      "Problem statements are revealed at the venue.",
      "Teams of exactly 4 members.",
      "A qualification quiz is part of Deja Vu. The quiz link is shared after registration once it is made available.",
    ],
    registerPath: "/register/hackathon",
    hasQualificationQuiz: true,
  },
  debate: {
    slug: "debate",
    name: "AI Debate",
    shortName: "AI Debate",
    day: 1,
    date: "2026-10-08",
    dateLabel: "October 8",
    format: "INDIVIDUAL",
    teamSize: 1,
    feePerPersonInr: 50,
    tagline: "An individual event on Day 1.",
    description:
      "AI Debate is an individual event on Day 1 of ILLUMINATE. Further details will be announced by the organisers.",
    highlights: [],
    notes: ["Individual participation."],
    registerPath: "/register/debate",
    hasQualificationQuiz: false,
  },
  "ipl-auction": {
    slug: "ipl-auction",
    name: "IPL Auction",
    shortName: "IPL Auction",
    day: 1,
    date: "2026-10-08",
    dateLabel: "October 8",
    format: "TEAM",
    teamSize: 4,
    feePerPersonInr: 50,
    tagline: "A team event for teams of four.",
    description:
      "IPL Auction is a team event on Day 1 of ILLUMINATE. Further details will be announced by the organisers.",
    highlights: [],
    notes: ["Teams of exactly 4 members."],
    registerPath: "/register/ipl-auction",
    hasQualificationQuiz: false,
  },
  illuminate: {
    slug: "illuminate",
    name: "Illuminate — Entrepreneurship Workshop",
    shortName: "Illuminate Workshop",
    day: 2,
    date: "2026-10-09",
    dateLabel: "October 9",
    format: "INDIVIDUAL",
    teamSize: 1,
    feePerPersonInr: 799,
    tagline: "The flagship of ILLUMINATE — an entrepreneurship workshop on Day 2.",
    // Description, benefits and notes are taken from E-Cell IIT Bombay's
    // illuminate 2026 brochure.
    description:
      "Illuminate, an initiative by E-Cell IIT Bombay, aims to spark entrepreneurial spirit and build business acumen in students across India through workshops on business models, finance, and core startup principles. This one-day workshop covers the Business Model Canvas, financial planning, pitching, and startup development.",
    highlights: [
      {
        title: "What you'll learn",
        items: ["Business Model Canvas", "Financial Planning", "Pitching", "Startup Development"],
      },
      {
        title: "What you receive",
        items: [
          "Training from seasoned entrepreneurs and professionals",
          "A startup kit with a Business Model Canvas",
          "A Certificate of Participation, certified by E-Cell IIT Bombay",
        ],
      },
    ],
    notes: [
      "Individual registration.",
      "A one-day workshop on October 9.",
      "Certificates are issued after the workshop.",
    ],
    initiativeBy: "E-Cell IIT Bombay",
    motto: "Empowering the next generation of Changemakers",
    registerPath: "/register/illuminate",
    hasQualificationQuiz: false,
  },
};

export const EVENT_LIST: EventContent[] = [EVENTS.hackathon, EVENTS.debate, EVENTS["ipl-auction"], EVENTS.illuminate];

export const DAY_1_EVENTS = EVENT_LIST.filter((e) => e.day === 1);
export const DAY_2_EVENTS = EVENT_LIST.filter((e) => e.day === 2);

export function registrationAmountInr(event: Pick<EventContent, "feePerPersonInr" | "teamSize">): number {
  return event.feePerPersonInr * event.teamSize;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function feeLabel(event: EventContent): string {
  if (event.format === "TEAM") {
    return `${formatInr(event.feePerPersonInr)} per person · ${formatInr(registrationAmountInr(event))} per team`;
  }
  return `${formatInr(event.feePerPersonInr)} per person`;
}
