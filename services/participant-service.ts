import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { EventSlug, ParticipantRegistration } from "@/types/domain";
import { getQuizConfig, QUIZ_EVENT_SLUG, resolveQuizAccess } from "./quiz-service";

/** Every registration that lists this email as contact, participant, team leader or member. */
export async function getParticipantRegistrations(email: string): Promise<ParticipantRegistration[]> {
  const rows = await prisma.registration.findMany({
    where: {
      OR: [
        { contactEmail: email },
        { participant: { email } },
        { team: { leaderEmail: email } },
        { team: { members: { some: { email } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      registrationCode: true,
      createdAt: true,
      event: { select: { slug: true, name: true, day: true, date: true } },
      payment: { select: { amountInr: true, status: true, rejectionReason: true } },
      team: { select: { name: true, members: { select: { name: true }, orderBy: { position: "asc" } } } },
    },
  });

  const needsQuiz = rows.some((r) => r.event.slug === QUIZ_EVENT_SLUG);
  const quizConfig = needsQuiz ? await getQuizConfig() : null;

  return rows
    .filter((r) => r.payment)
    .map((r) => {
      const status = r.payment!.status;
      const slug = r.event.slug as EventSlug;
      return {
        registrationId: r.registrationCode,
        event: {
          slug,
          name: r.event.name,
          day: r.event.day === 2 ? 2 : 1,
          date: r.event.date.toISOString().slice(0, 10),
        },
        amountInr: r.payment!.amountInr,
        paymentStatus: status,
        rejectionReason: status === "REJECTED" ? r.payment!.rejectionReason : null,
        submittedAt: r.createdAt.toISOString(),
        team: r.team ? { name: r.team.name, members: r.team.members.map((m) => m.name) } : null,
        quiz: quizConfig && slug === QUIZ_EVENT_SLUG ? resolveQuizAccess(quizConfig, status) : null,
      };
    });
}
