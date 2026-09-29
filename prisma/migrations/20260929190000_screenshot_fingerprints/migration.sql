-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "screenshotAspect" DOUBLE PRECISION,
ADD COLUMN     "screenshotFingerprint" BYTEA,
ADD COLUMN     "screenshotMatchCode" TEXT,
ADD COLUMN     "screenshotSha256" TEXT;

-- CreateIndex
CREATE INDEX "Payment_screenshotSha256_idx" ON "Payment"("screenshotSha256");

-- CreateIndex
CREATE INDEX "Payment_screenshotMatchCode_idx" ON "Payment"("screenshotMatchCode");
