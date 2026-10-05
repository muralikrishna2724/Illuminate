import { z } from "zod";
import type { EventSlug } from "@/types/domain";

/**
 * Short AI survey on the Mind x Machine registration form. It helps the
 * organisers gauge participants' grasp of the debate's context: the
 * real-world impact of AI. Knowledge questions have a right answer (kept
 * server-side in services/debate-survey-scoring.ts so it never reaches the
 * browser); opinion questions don't.
 */

export const SURVEY_EVENT_SLUG: EventSlug = "debate";

export interface SurveyQuestion {
  id: "llm" | "bias" | "deepfake" | "familiarity" | "jobsStance";
  kind: "knowledge" | "opinion";
  prompt: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export const DEBATE_SURVEY_QUESTIONS: ReadonlyArray<SurveyQuestion> = [
  {
    id: "llm",
    kind: "knowledge",
    prompt: "Tools like ChatGPT and Gemini are built on an “LLM”. What does LLM stand for?",
    options: [
      { value: "large-language-model", label: "Large Language Model" },
      { value: "linear-logic-machine", label: "Linear Logic Machine" },
      { value: "learning-loop-module", label: "Learning Loop Module" },
      { value: "low-latency-model", label: "Low-Latency Model" },
    ],
  },
  {
    id: "bias",
    kind: "knowledge",
    prompt: "An AI hiring tool rejects more women because it learned from past hiring decisions. This is an example of…",
    options: [
      { value: "hardware-fault", label: "A hardware fault" },
      { value: "algorithmic-bias", label: "Algorithmic bias" },
      { value: "encryption", label: "Data encryption" },
      { value: "phishing", label: "Phishing" },
    ],
  },
  {
    id: "deepfake",
    kind: "knowledge",
    prompt: "A realistic but fake video of a public figure, created with AI, is called a…",
    options: [
      { value: "chatbot", label: "Chatbot" },
      { value: "firewall", label: "Firewall" },
      { value: "deepfake", label: "Deepfake" },
      { value: "captcha", label: "CAPTCHA" },
    ],
  },
  {
    id: "familiarity",
    kind: "opinion",
    prompt: "How often do you use AI tools (ChatGPT, Gemini, Copilot…)?",
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "regularly", label: "Regularly" },
      { value: "build", label: "I build with them" },
    ],
  },
  {
    id: "jobsStance",
    kind: "opinion",
    prompt: "Where do you stand: “AI will create more jobs than it takes away.”",
    options: [
      { value: "agree", label: "Agree" },
      { value: "disagree", label: "Disagree" },
      { value: "not-sure", label: "Not sure yet" },
    ],
  },
];

export const SURVEY_TOPIC_MAX = 300;
export const SURVEY_ANSWER_REQUIRED = "Please choose an answer.";

const answer = (q: SurveyQuestion) =>
  z.enum(q.options.map((o) => o.value) as [string, ...string[]], { error: SURVEY_ANSWER_REQUIRED });

/** Every multiple-choice answer is required; the topic line is optional. */
export const debateSurveySchema = z.object({
  llm: answer(DEBATE_SURVEY_QUESTIONS[0]!),
  bias: answer(DEBATE_SURVEY_QUESTIONS[1]!),
  deepfake: answer(DEBATE_SURVEY_QUESTIONS[2]!),
  familiarity: answer(DEBATE_SURVEY_QUESTIONS[3]!),
  jobsStance: answer(DEBATE_SURVEY_QUESTIONS[4]!),
  topic: z
    .string()
    .trim()
    .max(SURVEY_TOPIC_MAX, `Please keep this under ${SURVEY_TOPIC_MAX} characters.`)
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type DebateSurveyInput = z.input<typeof debateSurveySchema>;
export type DebateSurvey = z.output<typeof debateSurveySchema>;

export function surveyAnswerLabel(questionId: SurveyQuestion["id"], value: string | undefined): string | null {
  const q = DEBATE_SURVEY_QUESTIONS.find((x) => x.id === questionId);
  return q?.options.find((o) => o.value === value)?.label ?? null;
}
