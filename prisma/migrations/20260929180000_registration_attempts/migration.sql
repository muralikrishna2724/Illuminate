-- CreateEnum
CREATE TYPE "AttemptSource" AS ENUM ('SERVER', 'BROWSER');

-- CreateTable
CREATE TABLE "RegistrationAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventSlug" TEXT NOT NULL,
    "source" "AttemptSource" NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "fieldErrors" JSONB,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "utr" TEXT,
    "screenshotName" TEXT,
    "screenshotType" TEXT,
    "screenshotSize" INTEGER,
    "userAgent" TEXT,

    CONSTRAINT "RegistrationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegistrationAttempt_createdAt_idx" ON "RegistrationAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "RegistrationAttempt_eventSlug_createdAt_idx" ON "RegistrationAttempt"("eventSlug", "createdAt");

-- CreateIndex
CREATE INDEX "RegistrationAttempt_utr_idx" ON "RegistrationAttempt"("utr");

-- CreateIndex
CREATE INDEX "RegistrationAttempt_contactEmail_idx" ON "RegistrationAttempt"("contactEmail");

-- Admin-only data: never readable through the shared database's public API.
ALTER TABLE "RegistrationAttempt" ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE "RegistrationAttempt" FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
