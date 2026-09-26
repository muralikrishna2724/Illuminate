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
    id: "what-is-illuminate",
    question: "What is ILLUMINATE?",
    answer:
      "ILLUMINATE is a 2-day college innovation, technology, entrepreneurship and creative event on October 8–9. Day 1 (October 8) has the Deja Vu Hackathon, AI Debate and IPL Auction. Day 2 (October 9) is Illuminate — the Entrepreneurship Workshop.",
    featured: true,
  },
  {
    id: "what-is-deja-vu",
    question: "What is the Deja Vu Hackathon?",
    answer:
      "Deja Vu is a problem-solving hackathon where teams tackle real-world challenges through innovative technology solutions. Its themes are Agentic AI, AI for Intelligent & Resilient Networks, and College Problem Statements. The actual problem statements are revealed at the venue.",
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
      "Deja Vu has a qualification quiz. The quiz link will appear on your registration confirmation and on your registration status page once the organisers make it available.",
  },
  {
    id: "fee-debate",
    question: "What is the AI Debate fee?",
    answer: "AI Debate is an individual event. The fee is ₹50 per person.",
  },
  {
    id: "team-size-ipl",
    question: "What is the IPL Auction team size?",
    answer: "IPL Auction teams must have exactly 4 members. The fee is ₹50 per person, which is ₹200 per team.",
  },
  {
    id: "what-is-workshop",
    question: "What is the Illuminate Workshop?",
    answer:
      "Illuminate — Entrepreneurship Workshop is a one-day workshop on Day 2 (October 9), an initiative by E-Cell IIT Bombay. It covers the Business Model Canvas, Financial Planning, Pitching, and Startup Development. The fee is ₹799 per person.",
    featured: true,
  },
  {
    id: "workshop-includes",
    question: "What is included with the workshop?",
    answer:
      "Workshop participants are trained by seasoned entrepreneurs and professionals, and receive a startup kit with a Business Model Canvas and a Certificate of Participation certified by E-Cell IIT Bombay.",
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
      "Use the registration ID you received after submitting (it looks like ILM-XXXXXX) on the “Check registration status” page to see whether your payment is pending, verified or rejected.",
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
