/*
# Enable realtime dashboard for wedding RSVP responses

1. Purpose
- The public invitation form only needs INSERT access, so the base
  migration intentionally denies SELECT.
- This migration opens SELECT to anon/authenticated so the live
  dashboard (`#/dashboard`) can read the table and subscribe to changes.

2. Changes
- Adds a SELECT policy "Public can read wedding RSVPs".
- Adds `public.wedding_rsvp_responses` to the `supabase_realtime` publication
  so `postgres_changes` events fire for INSERT/UPDATE/DELETE.

3. Security note
- This makes guest names/counts visible to anyone with the anon key.
- If you want the board private instead, do NOT apply this file; build the
  dashboard with a service_role key behind auth, or restrict the SELECT
  policy to `authenticated` users only (see commented alternative below).
- Apply with: supabase db push
*/

-- Allow the dashboard to read all RSVP rows.
DROP POLICY IF EXISTS "Public can read wedding RSVPs" ON public.wedding_rsvp_responses;
CREATE POLICY "Public can read wedding RSVPs"
  ON public.wedding_rsvp_responses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Alternative (private board, logged-in users only):
-- DROP POLICY IF EXISTS "Authenticated can read wedding RSVPs" ON public.wedding_rsvp_responses;
-- CREATE POLICY "Authenticated can read wedding RSVPs"
--   ON public.wedding_rsvp_responses
--   FOR SELECT
--   TO authenticated
--   USING (true);

-- Publish the table for Supabase Realtime.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'wedding_rsvp_responses'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wedding_rsvp_responses;
  END IF;
END $$;
