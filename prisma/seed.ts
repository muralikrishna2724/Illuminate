/**
 * Safe seed: creates/updates the four event records and an empty (disabled)
 * Deja Vu quiz configuration. It never creates registrations, payments or
 * admin users, so it is safe to run against production.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { EVENT_LIST } from "../lib/events/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const event of EVENT_LIST) {
    const data = {
      name: event.name,
      day: event.day,
      date: new Date(`${event.date}T00:00:00.000Z`),
      format: event.format,
      teamSize: event.teamSize,
      feePerPersonInr: event.feePerPersonInr,
    };
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: data,
      create: { slug: event.slug, ...data },
    });
    console.log(`✓ event ${event.slug} (${event.name}) — ₹${event.feePerPersonInr} × ${event.teamSize}`);
  }

  const hackathon = await prisma.event.findUniqueOrThrow({ where: { slug: "hackathon" } });
  await prisma.quizConfiguration.upsert({
    where: { eventId: hackathon.id },
    update: {}, // never overwrite a link configured by an admin
    create: { eventId: hackathon.id, enabled: false, quizLink: null, accessRule: "AFTER_SUBMISSION" },
  });
  console.log("✓ quiz configuration for Deja Vu (disabled until an admin adds a link)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
