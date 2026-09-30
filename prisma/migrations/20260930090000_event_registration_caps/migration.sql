-- AlterTable
ALTER TABLE "Event" ADD COLUMN "maxRegistrations" INTEGER;

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_maxRegistrations_positive" CHECK ("maxRegistrations" IS NULL OR "maxRegistrations" > 0);
