import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { EventSlug, ParticipantProfile, ParticipantRegistration } from "@/types/domain";
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

/**
 * The person's own details for the profile card. An email can appear as an
 * individual participant, a team member or a team leader; the most recent
 * record wins.
 */
export async function getParticipantProfile(email: string): Promise<ParticipantProfile | null> {
  const [participant, member, leader] = await Promise.all([
    prisma.participant.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { fullName: true, email: true, phone: true, college: true, department: true, year: true, createdAt: true },
    }),
    prisma.teamMember.findFirst({
      where: { email },
      orderBy: { team: { createdAt: "desc" } },
      select: { name: true, email: true, phone: true, department: true, year: true, team: { select: { college: true, createdAt: true } } },
    }),
    prisma.team.findFirst({
      where: { leaderEmail: email },
      orderBy: { createdAt: "desc" },
      select: { leaderName: true, leaderEmail: true, leaderPhone: true, college: true, createdAt: true },
    }),
  ]);

  const candidates: Array<ParticipantProfile & { at: number }> = [];
  if (participant) {
    candidates.push({
      name: participant.fullName,
      email: participant.email,
      phone: participant.phone,
      college: participant.college,
      department: participant.department,
      year: participant.year,
      at: participant.createdAt.getTime(),
    });
  }
  if (member) {
    candidates.push({
      name: member.name,
      email: member.email,
      phone: member.phone,
      college: member.team.college,
      department: member.department,
      year: member.year,
      at: member.team.createdAt.getTime(),
    });
  }
  if (leader) {
    // A leader is usually also a member; prefer the member record (it has department/year) when times tie.
    candidates.push({
      name: leader.leaderName,
      email: leader.leaderEmail,
      phone: leader.leaderPhone,
      college: leader.college,
      department: null,
      year: null,
      at: leader.createdAt.getTime() - 1,
    });
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.at - a.at);
  const { at: _at, ...profile } = candidates[0]!;
  // Fill department/year from another record of the same person if the newest lacks them.
  const withDetails = candidates.find((c) => c.department && c.year);
  return {
    ...profile,
    department: profile.department ?? withDetails?.department ?? null,
    year: profile.year ?? withDetails?.year ?? null,
  };
}
