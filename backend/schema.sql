-- PostgreSQL / Supabase: apply once using an admin connection before Production startup.
-- Keep the game schema off the public Supabase REST API. API accesses it with its DB connection.
BEGIN;
CREATE TABLE IF NOT EXISTS public."Players" (
 "Id" uuid PRIMARY KEY,
 "TokenHash" varchar(64),
 "GuestExpiresAt" timestamp with time zone,
 "ProgressJson" text NOT NULL DEFAULT '{}',
 "Version" bigint NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Players_TokenHash" ON public."Players" ("TokenHash");
ALTER TABLE public."Players" ENABLE ROW LEVEL SECURITY;
-- No client policies: anon/authenticated cannot read or write game state directly.
DO $$ BEGIN
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public."Players" FROM anon; END IF;
 IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public."Players" FROM authenticated; END IF;
END $$;
COMMIT;
-- Connect the trusted C# API as the table owner or a dedicated backend role with a suitable RLS policy.
-- Never put that connection string into VITE_* variables.
