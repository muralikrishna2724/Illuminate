import type { EventFormat, EventSlug } from "@/types/domain";
import { HACKATHON_THEMES } from "./themes";

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
  /** How long or when the event runs, when confirmed (e.g. "6-hour hackathon", "9:00 AM – 12:00 PM"). */
  duration?: string;
  /** Most registrations accepted (teams, for team events). Omitted means no limit. */
  maxRegistrations?: number;
  tagline: string;
  description: string;
  /** Labelled lists of confirmed facts (themes, topics, benefits…). */
  highlights: Array<{ title: string; items: string[] }>;
  /** Confirmed notes shown as plain statements. */
  notes: string[];
  /** Ordered stages of the event (e.g. an online round, then the main event). */
  phases?: Array<{ label: string; title: string; text: string }>;
  /** Highlighted closing block on the event's page: a motto plus summary lines. */
  spotlight?: { motto: string[]; lines: string[] };
  /** The organisation behind the event, e.g. "E-Cell IIT Bombay". */
  initiativeBy?: string;
  /** The event's own official tagline, when it has one. */
  motto?: string;
  registerPath: string;
  hasQualificationQuiz: boolean;
}

export const EVENT_YEAR_LABEL = "October 9–10";

export const EVENTS: Record<EventSlug, EventContent> = {
  hackathon: {
    slug: "hackathon",
    name: "Deja Vu Hackathon",
    shortName: "Deja Vu",
    day: 1,
    date: "2026-10-09",
    dateLabel: "October 9",
    format: "TEAM",
    teamSize: 4,
    feePerPersonInr: 50,
    duration: "6-hour hackathon",
    tagline: "Real-world problems. Innovative technology solutions.",
    description:
      "Deja Vu is a problem-solving hackathon where teams tackle real-world challenges through innovative technology solutions. It runs in two phases: an online qualification quiz, then an offline hackathon for the teams shortlisted from it. Each team chooses one of three themes when registering: Agentic AI, Hardware and Embedded Systems, or CampusSolve. The actual problem statements are revealed at the venue.",
    highlights: [
      {
        title: "Themes",
        items: HACKATHON_THEMES.map((t) => t.label),
      },
    ],
    phases: [
      {
        label: "Phase 1 · Online",
        title: "Qualification quiz",
        text: "Once your payment is verified, the quiz link appears on your dashboard. Teams are shortlisted from the quiz.",
      },
      {
        label: "Phase 2 · On campus",
        title: "Offline hackathon",
        text: "Shortlisted teams build their solutions at the venue on October 9, where the problem statements are revealed.",
      },
    ],
    notes: [
      "Teams of exactly 4 members.",
      "Each team chooses one theme when registering.",
      "Only teams shortlisted from the quiz take part in the offline hackathon.",
      "The online qualification quiz will be held on October 7 or 8. Quiz details will be shared with registered teams.",
      "Participants of Mind x Machine: The AI Debate ARENA or the IPL Auction can't take part in the hackathon. Choose either the hackathon on its own, or the debate and the auction (you can do both).",
    ],
    spotlight: {
      motto: ["Think", "Pick", "Build", "Impact"],
      lines: [
        "A two-stage hackathon where participants begin with a quiz, choose a problem statement, and develop a solution.",
        "A two-stage hackathon solving real-world challenges.",
      ],
    },
    registerPath: "/register/hackathon",
    hasQualificationQuiz: true,
  },
  debate: {
    slug: "debate",
    name: "Mind x Machine: The AI Debate ARENA",
    shortName: "Mind x Machine",
    day: 1,
    date: "2026-10-09",
    dateLabel: "October 9",
    format: "INDIVIDUAL",
    teamSize: 1,
    feePerPersonInr: 50,
    duration: "9:00 AM – 12:00 PM",
    maxRegistrations: 50,
    tagline: "An individual event on Day 1.",
    description:
      "A platform for participants to analyse, discuss, and debate the real-world impact of Artificial Intelligence.",
    highlights: [],
    notes: [
      "Individual participation.",
      "Limited to 50 participants.",
      "You can take part in both this and the IPL Auction, but not in the Deja Vu Hackathon.",
    ],
    registerPath: "/register/debate",
    hasQualificationQuiz: false,
  },
  "ipl-auction": {
    slug: "ipl-auction",
    name: "IPL Auction",
    shortName: "IPL Auction",
    day: 1,
    date: "2026-10-09",
    dateLabel: "October 9",
    format: "INDIVIDUAL",
    teamSize: 1,
    feePerPersonInr: 50,
    duration: "1:00 PM – 4:00 PM",
    tagline: "An individual event on Day 1.",
    description:
      "A competitive IPL-inspired event that puts your cricket knowledge, strategy, and team-building skills to the test.",
    highlights: [],
    notes: [
      "Individual participation.",
      "You can take part in both this and Mind x Machine: The AI Debate ARENA, but not in the Deja Vu Hackathon.",
      "An online quiz will be held on October 7 or 8. Quiz details will be shared with registered participants.",
    ],
    registerPath: "/register/ipl-auction",
    hasQualificationQuiz: false,
  },
  illuminate: {
    slug: "illuminate",
    name: "Illuminate — Entrepreneurship Workshop",
    shortName: "Illuminate Workshop",
    day: 2,
    date: "2026-10-10",
    dateLabel: "October 10",
    format: "INDIVIDUAL",
    teamSize: 1,
    feePerPersonInr: 799,
    tagline: "The flagship of INNOVENTRA — an entrepreneurship workshop on Day 2.",
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
      "Individual registration — participants are organised into teams during the workshop.",
      "A one-day workshop on October 10.",
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

/** Rewards for the Day 1 competitions, shown as a callout on the Day 1 page. */
export const DAY_2_EVENTS = EVENT_LIST.filter((e) => e.day === 2);

export function registrationAmountInr(event: Pick<EventContent, "feePerPersonInr" | "teamSize">): number {
  return event.feePerPersonInr * event.teamSize;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** What the fee covers, when the organisers have confirmed it (empty otherwise). */
export function feeIncludes(event: EventContent): string[] {
  return event.highlights.find((h) => h.title === "What you receive")?.items ?? [];
}

export function feeLabel(event: EventContent): string {
  if (event.format === "TEAM") {
    return `${formatInr(event.feePerPersonInr)} per person · ${formatInr(registrationAmountInr(event))} per team`;
  }
  return `${formatInr(event.feePerPersonInr)} per person`;
}
