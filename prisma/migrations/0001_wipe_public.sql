-- Wipe the old `public` schema tables/enums (Prisma will recreate everything in `movie`).
-- Safe ONLY because all data here is throwaway (test users + seat seed).
-- Re-seed with `npx prisma db seed` afterwards.

BEGIN;

DROP TABLE IF EXISTS public."BookingLog"   CASCADE;
DROP TABLE IF EXISTS public."Verification" CASCADE;
DROP TABLE IF EXISTS public."Session"      CASCADE;
DROP TABLE IF EXISTS public."Account"      CASCADE;
DROP TABLE IF EXISTS public."Student"      CASCADE;
DROP TABLE IF EXISTS public."Seat"         CASCADE;
DROP TABLE IF EXISTS public."SiteSetting"  CASCADE;
DROP TABLE IF EXISTS public."User"         CASCADE;

DROP TYPE IF EXISTS public."SeatStatus";
DROP TYPE IF EXISTS public."Role";

COMMIT;
