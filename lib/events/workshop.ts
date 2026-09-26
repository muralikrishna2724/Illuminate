/**
 * Illuminate workshop details from E-Cell IIT Bombay's illuminate 2026 college
 * brochure. Only participant-facing, confirmed content lives here; clock times
 * are deliberately left out until the organisers confirm them.
 */

export interface WorkshopSession {
  topic: string;
  activity: string;
  minutes: number;
}

export const WORKSHOP_SESSIONS: WorkshopSession[] = [
  {
    topic: "Introduction",
    activity: "Interactive exercises designed to help participants connect with one another and become acquainted with the speaker.",
    minutes: 15,
  },
  {
    topic: "What is Entrepreneurship",
    activity: "Understanding fundamental aspects of entrepreneurship, including its definition and the reasons behind its importance in today's world.",
    minutes: 15,
  },
  {
    topic: "Team Formation",
    activity: "Organising participants into teams to facilitate effective engagement and collaboration during the tasks that follow.",
    minutes: 15,
  },
  {
    topic: "Idea Generation & Problem Identification",
    activity: "A group activity focused on brainstorming and identifying problems, designed to stimulate creative thinking and collaborative problem-solving.",
    minutes: 15,
  },
  {
    topic: "Business Model Canvas (BMC) Workshop",
    activity: "The speaker gives an overview of the key components of the BMC and guides participants on how to fill it in for their chosen ideas.",
    minutes: 60,
  },
  {
    topic: "Team Activity: Filling Out the BMC",
    activity: "Teams follow a structured process to identify challenges, devise solutions, and complete the BMC in full.",
    minutes: 60,
  },
  {
    topic: "Finance for Entrepreneurs",
    activity: "Understanding financial principles relevant to entrepreneurship, including assessing the financial viability of ideas and financial planning.",
    minutes: 30,
  },
  {
    topic: "Insights into Startup Development",
    activity:
      "How startups are built by developing Minimum Viable Products (MVPs) and Proofs of Concept (POCs): creating prototypes and validating ideas through iterative testing and refinement.",
    minutes: 30,
  },
  {
    topic: "Pitching Workshop & Q&A",
    activity: "Present your business idea in groups and take part in a Q&A session, aimed at improving pitching skills and receiving constructive feedback.",
    minutes: 30,
  },
];

/** How the day runs, as described in the brochure. */
export const WORKSHOP_FORMAT: string[] = [
  "An extensive one-day workshop of about 5–6 hours.",
  "Conducted by experts and real entrepreneurs.",
  "A speaker session, case-study training and hands-on work with the Business Model Canvas.",
];

export const ABOUT_ECELL = {
  name: "E-Cell IIT Bombay",
  paragraphs: [
    "The Entrepreneurship Cell, IIT Bombay (E-Cell) firmly believes that emerging economies like India need the drive and innovation of young entrepreneurs. To promote the spirit of entrepreneurship among the youth, E-Cell has conceptualised many initiatives for college students, young entrepreneurs and working professionals.",
    "E-Cell, IIT Bombay has been recognised as the leading entrepreneurship-promoting student organisation in the country by the National Entrepreneurship Network Achievement Awards, instituted by the Wadhwani Foundation, and was felicitated at TiECon 2005.",
  ],
} as const;

/** Previous-year figures for E-Cell IIT Bombay's illuminate workshops. */
export const ECELL_WORKSHOP_STATS: Array<{ value: string; label: string }> = [
  { value: "18,000+", label: "Students" },
  { value: "200+", label: "Workshops" },
  { value: "15+", label: "States" },
];

export function formatMinutes(minutes: number): string {
  return minutes >= 60 && minutes % 60 === 0 ? `${minutes / 60} hr` : `${minutes} min`;
}
