import "server-only";
import { prisma } from "@/lib/db/prisma";
import type { EventSlug, ParticipantProfile, ParticipantRegistration } from "@/types/domain";
import { THEMED_EVENT_SLUG, themeLabel, type HackathonTheme } from "@/lib/events/themes";
import { whatsappGroupFor } from "@/lib/events/whatsapp";
import { conflict, notFound } from "@/lib/http/errors";
import { normalizeRegistrationCode } from "@/lib/registration-id";
import { getQuizConfig, QUIZ_EVENT_SLUG, resolveQuizAccess } from "./quiz-service";

/** Where this email appears on a registration: contact, participant, team leader or member. */
const belongsTo = (email: string) => ({
  OR: [
    { contactEmail: email },
    { participant: { email } },
    { team: { leaderEmail: email } },
    { team: { members: { some: { email } } } },
  ],
});

/** Every registration that lists this email as contact, participant, team leader or member. */
export async function getParticipantRegistrations(email: string): Promise<ParticipantRegistration[]> {
  const rows = await prisma.registration.findMany({
    where: belongsTo(email),
    orderBy: { createdAt: "desc" },
    select: {
      registrationCode: true,
      createdAt: true,
      event: { select: { slug: true, name: true, day: true, date: true } },
      payment: { select: { amountInr: true, status: true, rejectionReason: true } },
      team: { select: { id: true, name: true, theme: true, members: { select: { name: true }, orderBy: { position: "asc" } } } },
    },
  });

  const needsQuiz = rows.some((r) => r.event.slug === QUIZ_EVENT_SLUG);
  const quizConfig = needsQuiz ? await getQuizConfig() : null;

  return rows
    .filter((r) => r.payment)
    .map((r) => {
      const status = r.payment!.status;
      const slug = r.event.slug as EventSlug;
      const quiz = quizConfig && slug === QUIZ_EVENT_SLUG ? resolveQuizAccess(quizConfig, status) : null;
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
        team: r.team ? { name: r.team.name, members: r.team.members.map((m) => m.name), theme: themeLabel(r.team.theme) } : null,
        canChooseTheme: slug === THEMED_EVENT_SLUG && r.team !== null && r.team.theme === null && status !== "REJECTED",
        quiz,
        quizId: quiz?.state === "available" && r.team ? r.team.id : null,
        whatsappGroupUrl: whatsappGroupFor(slug, status),
      };
    });
}

/**
 * Lets a Deja Vu team that registered before themes existed choose one, once.
 * Only someone on that registration can choose, and a chosen theme is never
 * overwritten (the update only matches a team whose theme is still empty).
 */
export async function chooseHackathonTheme(email: string, rawCode: string, theme: HackathonTheme): Promise<{ theme: string }> {
  const registration = await prisma.registration.findFirst({
    where: { registrationCode: normalizeRegistrationCode(rawCode), ...belongsTo(email) },
    select: { event: { select: { slug: true } }, payment: { select: { status: true } }, team: { select: { id: true, theme: true } } },
  });
  if (!registration?.team || registration.event.slug !== THEMED_EVENT_SLUG) {
    throw notFound("We couldn't find a Deja Vu team registration with that ID on your account.");
  }
  if (registration.payment?.status === "REJECTED") {
    throw conflict("This registration's payment was rejected. Please contact the organisers.");
  }
  const { count } = await prisma.team.updateMany({ where: { id: registration.team.id, theme: null }, data: { theme } });
  if (count === 0) throw conflict("Your team has already chosen a theme. To change it, please contact the organisers.");
  return { theme: themeLabel(theme)! };
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
