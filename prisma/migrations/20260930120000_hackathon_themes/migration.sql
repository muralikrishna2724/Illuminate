-- CreateEnum
CREATE TYPE "HackathonTheme" AS ENUM ('AGENTIC_AI', 'HARDWARE_EMBEDDED', 'CAMPUS_SOLVE');

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "theme" "HackathonTheme";
