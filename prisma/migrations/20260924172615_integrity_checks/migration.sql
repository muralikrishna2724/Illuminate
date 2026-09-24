-- Database-level business-rule guards (defence in depth; the API enforces the same rules).

ALTER TABLE "Event"
  ADD CONSTRAINT "Event_feePerPersonInr_positive" CHECK ("feePerPersonInr" > 0),
  ADD CONSTRAINT "Event_teamSize_valid" CHECK (
    ("format" = 'INDIVIDUAL' AND "teamSize" = 1) OR ("format" = 'TEAM' AND "teamSize" >= 2)
  ),
  ADD CONSTRAINT "Event_day_valid" CHECK ("day" IN (1, 2));

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amountInr_positive" CHECK ("amountInr" > 0),
  ADD CONSTRAINT "Payment_utr_format" CHECK ("utr" ~ '^[A-Z0-9]{6,35}$'),
  ADD CONSTRAINT "Payment_screenshotSize_positive" CHECK ("screenshotSize" > 0),
  ADD CONSTRAINT "Payment_verified_consistency" CHECK (
    ("status" = 'VERIFIED' AND "verifiedAt" IS NOT NULL) OR ("status" <> 'VERIFIED' AND "verifiedAt" IS NULL)
  ),
  ADD CONSTRAINT "Payment_rejected_consistency" CHECK (
    ("status" = 'REJECTED' AND "rejectedAt" IS NOT NULL) OR ("status" <> 'REJECTED' AND "rejectedAt" IS NULL)
  );

ALTER TABLE "TeamMember"
  ADD CONSTRAINT "TeamMember_position_valid" CHECK ("position" >= 1);

ALTER TABLE "Registration"
  ADD CONSTRAINT "Registration_code_format" CHECK ("registrationCode" ~ '^ILM-[0-9A-Z]{6}$');
