-- CreateTable
CREATE TABLE "ParticipantSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "ParticipantSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParticipantSession_tokenHash_key" ON "ParticipantSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ParticipantSession_email_idx" ON "ParticipantSession"("email");

-- CreateIndex
CREATE INDEX "ParticipantSession_expiresAt_idx" ON "ParticipantSession"("expiresAt");
