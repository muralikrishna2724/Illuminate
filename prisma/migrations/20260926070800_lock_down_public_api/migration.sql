-- Lock the application tables away from any auto-generated public API.
--
-- Supabase exposes the `public` schema through PostgREST using the `anon` and
-- `authenticated` roles. This app never uses that API — all access goes through
-- the Next.js server, connected as the database owner — so:
--   1. Row Level Security is enabled on every table with NO policies, which
--      denies all rows to non-owner roles (the owner / BYPASSRLS roles the
--      app uses are unaffected).
--   2. Where Supabase's API roles exist, their privileges are revoked outright.
-- On plain PostgreSQL (local development) step 2 is skipped.

ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ParticipantSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Registration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuizConfiguration" ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  api_role text;
BEGIN
  FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', api_role);
      EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', api_role);
    END IF;
  END LOOP;
END
$$;
