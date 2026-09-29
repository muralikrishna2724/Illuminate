-- Registration IDs become sequential INV-01, INV-02, … (allocated by the app
-- inside the registration transaction). NOT VALID keeps any earlier ILM-XXXXXX
-- rows readable while every new row must use the INV format.
ALTER TABLE "Registration" DROP CONSTRAINT IF EXISTS "Registration_code_format";
ALTER TABLE "Registration"
  ADD CONSTRAINT "Registration_code_format" CHECK ("registrationCode" ~ '^INV-[0-9]{2,}$') NOT VALID;
