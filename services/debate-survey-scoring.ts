import "server-only";
import { DEBATE_SURVEY_QUESTIONS, surveyAnswerLabel, type DebateSurvey } from "@/lib/events/debate-survey";

/** Right answers to the knowledge questions. Server-only, so the form can't reveal them. */
const CORRECT: Partial<Record<keyof DebateSurvey, string>> = {
  llm: "large-language-model",
  bias: "algorithmic-bias",
  deepfake: "deepfake",
};

export interface SurveyReview {
  score: number;
  outOf: number;
  answers: Array<{ prompt: string; answer: string; kind: "knowledge" | "opinion"; correct: boolean | null }>;
  topic: string | null;
}

/** Turns stored answers into what admins see: labels, right/wrong, and a knowledge score. */
export function reviewSurvey(raw: unknown): SurveyReview | null {
  if (!raw || typeof raw !== "object") return null;
  const survey = raw as Partial<Record<string, unknown>>;
  const answers = DEBATE_SURVEY_QUESTIONS.map((q) => {
    const value = typeof survey[q.id] === "string" ? (survey[q.id] as string) : undefined;
    const correct = q.kind === "knowledge" ? value !== undefined && CORRECT[q.id] === value : null;
    return { prompt: q.prompt, answer: surveyAnswerLabel(q.id, value) ?? "—", kind: q.kind, correct };
  });
  const knowledge = answers.filter((a) => a.kind === "knowledge");
  return {
    score: knowledge.filter((a) => a.correct).length,
    outOf: knowledge.length,
    answers,
    topic: typeof survey.topic === "string" && survey.topic ? survey.topic : null,
  };
}
