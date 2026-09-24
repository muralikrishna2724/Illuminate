import "server-only";
import type { QuizConfiguration } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { quizUpdateSchema } from "@/lib/validation/admin";
import { resolveQuizAccess } from "@/lib/quiz-access";
import type { Quiz } from "@/types/domain";

export { resolveQuizAccess };
import { getEventBySlug } from "./event-service";

/** The Deja Vu Hackathon is the only event with a qualification quiz. */
export const QUIZ_EVENT_SLUG = "hackathon" as const;

async function getOrCreateQuizConfig(): Promise<QuizConfiguration & { updatedBy: { name: string } | null }> {
  const event = await getEventBySlug(QUIZ_EVENT_SLUG);
  return prisma.quizConfiguration.upsert({
    where: { eventId: event.id },
    update: {},
    create: { eventId: event.id, enabled: false, quizLink: null },
    include: { updatedBy: { select: { name: true } } },
  });
}

function toQuizDto(config: QuizConfiguration & { updatedBy: { name: string } | null }): Quiz {
  return {
    eventSlug: QUIZ_EVENT_SLUG,
    enabled: config.enabled,
    quizLink: config.quizLink,
    accessRule: config.accessRule,
    updatedAt: config.updatedAt.toISOString(),
    updatedBy: config.updatedBy?.name ?? null,
  };
}

export async function getQuizConfig(): Promise<Quiz> {
  return toQuizDto(await getOrCreateQuizConfig());
}

export async function updateQuizConfig(input: unknown, adminId: string): Promise<Quiz> {
  const data = quizUpdateSchema.parse(input);
  const event = await getEventBySlug(QUIZ_EVENT_SLUG);
  const updated = await prisma.quizConfiguration.upsert({
    where: { eventId: event.id },
    update: { quizLink: data.quizLink, enabled: data.enabled, accessRule: data.accessRule, updatedById: adminId },
    create: {
      eventId: event.id,
      quizLink: data.quizLink,
      enabled: data.enabled,
      accessRule: data.accessRule,
      updatedById: adminId,
    },
    include: { updatedBy: { select: { name: true } } },
  });
  return toQuizDto(updated);
}
