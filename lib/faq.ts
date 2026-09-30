/**
 * FAQs — written only from confirmed event information.
 * Add new entries here as the organisers confirm more details.
 */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  featured?: boolean;
}

export const FAQS: FaqItem[] = [
  {
    id: "what-is-innoventra",
    question: "What is INNOVENTRA?",
    answer:
      "INNOVENTRA is a 2-day college innovation, technology, entrepreneurship and creative event on October 9–10. Day 1 (October 9) has the Deja Vu Hackathon, Mind x Machine: The AI Debate ARENA and IPL Auction. Day 2 (October 10) is Illuminate — the Entrepreneurship Workshop.",
    featured: true,
  },
  {
    id: "venue",
    question: "Where is INNOVENTRA held?",
    answer:
      "At CVR College of Engineering (A UGC Autonomous Institution, NAAC 'A' Grade), Vastunagar, Mangalpalli (V), Ibrahimpatnam (M), Rangareddy (D), Telangana 501510. INNOVENTRA is hosted by CVR College of Engineering in collaboration with E-Cell IIT Bombay, its National Entrepreneurship Challenge 2026, IEEE ComSoc and CVR NewGen IEDC.",
    featured: true,
  },
  {
    id: "what-is-deja-vu",
    question: "What is the Deja Vu Hackathon?",
    answer:
      "Deja Vu is a problem-solving hackathon where teams tackle real-world challenges through innovative technology solutions. It runs in two phases: Phase 1 is an online qualification quiz, and the teams shortlisted from it attend Phase 2, the offline hackathon at the venue. Its themes are Agentic AI, Hardware and Embedded Systems, and CampusSolve; every team chooses one when registering. The actual problem statements are revealed at the venue.",
    featured: true,
  },
  {
    id: "team-size-deja-vu",
    question: "How many members are required for Deja Vu?",
    answer: "Deja Vu teams must have exactly 4 members. Registrations with fewer or more than 4 members are not accepted.",
  },
  {
    id: "fee-deja-vu",
    question: "What is the Deja Vu registration fee?",
    answer: "₹50 per person, which is ₹200 per team of 4.",
    featured: true,
  },
  {
    id: "quiz",
    question: "When will the Deja Vu quiz link be available?",
    answer:
      "The qualification quiz is Phase 1 of Deja Vu. Once the organisers verify your payment, the quiz link appears on your dashboard (log in with your email and registration ID) and on your registration status page. Teams shortlisted from the quiz attend the offline hackathon.",
  },
  {
    id: "fee-under-the-hood-of-ai",
    question: "What is the Mind x Machine: The AI Debate ARENA fee?",
    answer:
      "Mind x Machine: The AI Debate ARENA is an individual event. The fee is ₹50 per person. It is limited to 50 participants, and registration closes once all spots are filled.",
  },
  {
    id: "team-size-ipl",
    question: "How many members are required for the IPL Auction?",
    answer:
      "IPL Auction teams must have exactly 5 members. The fee is ₹50 per person, which is ₹250 per team of 5. It is limited to 10 teams, and registration closes once all spots are filled.",
  },
  {
    id: "what-is-workshop",
    question: "What is the Illuminate Workshop?",
    answer:
      "Illuminate — Entrepreneurship Workshop is a one-day workshop on Day 2 (October 10), an initiative by E-Cell IIT Bombay. It covers the Business Model Canvas, Financial Planning, Pitching, and Startup Development. The fee is ₹799 per person.",
    featured: true,
  },
  {
    id: "workshop-includes",
    question: "What is included with the workshop?",
    answer:
      "Workshop participants are trained by seasoned entrepreneurs and professionals, and receive a startup kit with a Business Model Canvas and a Certificate of Participation certified by E-Cell IIT Bombay.",
  },
  {
    id: "workshop-structure",
    question: "What happens during the workshop?",
    answer:
      "It is a hands-on, one-day workshop of about 5–6 hours, conducted by experts and real entrepreneurs. Sessions cover what entrepreneurship is, team formation, idea generation and problem identification, the Business Model Canvas (with a team activity to fill one out), finance for entrepreneurs, startup development (MVPs and proofs of concept), and a pitching workshop with Q&A. The full session plan is on the Day 2 page.",
  },
  {
    id: "workshop-team",
    question: "Do I need a team for the workshop?",
    answer: "No. Registration is individual, and participants are organised into teams during the workshop.",
  },
  {
    id: "workshop-exclusive-benefits",
    question: "Are there any extra benefits for workshop participants?",
    answer:
      "Yes — exclusive benefits worth ₹50,000, available for a limited time only: free entry passes to IIT Bombay for the first 50 registrations of the Illuminate workshop, and benefits on E-Summit passes and accommodation.",
  },
  {
    id: "workshop-certificate",
    question: "When will I get my workshop certificate?",
    answer: "Certificates are issued after the workshop.",
  },
  {
    id: "payment-verification",
    question: "How does payment verification work?",
    answer:
      "After paying, you submit your UTR / transaction ID and a screenshot of the payment with your registration. Your registration is created immediately with payment status PENDING. The organisers then manually check your UTR and screenshot against their payment records and mark the payment VERIFIED (or REJECTED, with a reason). Submitting the form does not by itself confirm the payment.",
    featured: true,
  },
  {
    id: "check-status",
    question: "How do I check my registration status?",
    answer:
      "Use the registration ID you received after submitting (it looks like INV-07) on the “Check registration status” page to see whether your payment is pending, verified or rejected.",
  },
  {
    id: "duplicate-utr",
    question: "Can I reuse a transaction ID?",
    answer:
      "No. Each UTR / transaction ID can be submitted only once. If a transaction ID has already been used, the registration will not be accepted.",
  },
  {
    id: "screenshot-format",
    question: "Which screenshot formats are accepted?",
    answer: "JPG, JPEG, PNG or WEBP images, up to 4 MB.",
  },
];
