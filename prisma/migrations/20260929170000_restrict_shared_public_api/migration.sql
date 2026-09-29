-- The database is shared with the Deja Vu quiz app, whose setup re-granted the
-- public API roles access to every table and added "read for all users"
-- policies on "Registration" and "Team". That exposed registrants' names,
-- emails and phones to anyone holding the public (anon) key.
--
-- Re-lock this app's tables, then allow only the ID columns the quiz app reads
-- (it counts registered Deja Vu teams). The quiz app's own tables are left alone.
DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format(
        'REVOKE ALL ON TABLE "AdminSession", "AdminUser", "Event", "Participant", "ParticipantSession", "Payment", '
        '"PaymentAuditLog", "QuizConfiguration", "Registration", "Team", "TeamMember", "_prisma_migrations" FROM %I',
        role_name
      );
      EXECUTE format('GRANT SELECT (id, "eventId") ON TABLE "Registration" TO %I', role_name);
      EXECUTE format('GRANT SELECT (id, "registrationId") ON TABLE "Team" TO %I', role_name);
    END IF;
  END LOOP;
END $$;
