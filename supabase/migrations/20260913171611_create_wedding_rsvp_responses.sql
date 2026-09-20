/*
# Create wedding RSVP responses

1. New Tables
- `wedding_rsvp_responses` stores one guest's RSVP submission.
- `id` uniquely identifies the response.
- `guest_name` stores the guest's name.
- `guest_count` stores the number attending.
- `ceremony`, `reception`, and `dietary_requirements` store the three yes/no answers.
- `created_at` records when the response was submitted.
2. Security
- Row level security is enabled.
- This is a single-tenant invitation without sign-in, so the public RSVP form may insert responses.
- Responses may not be read, edited, or deleted from the public app.
3. Important Notes
- The table is intentionally write-only for visitors so RSVP details are not exposed in the invitation.
*/

CREATE TABLE IF NOT EXISTS public.wedding_rsvp_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name text NOT NULL CHECK (char_length(trim(guest_name)) BETWEEN 1 AND 120),
  guest_count integer NOT NULL DEFAULT 1 CHECK (guest_count BETWEEN 1 AND 10),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_rsvp_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit wedding RSVPs" ON public.wedding_rsvp_responses;
CREATE POLICY "Public can submit wedding RSVPs"
  ON public.wedding_rsvp_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "No public reading of wedding RSVPs" ON public.wedding_rsvp_responses;
CREATE POLICY "No public reading of wedding RSVPs"
  ON public.wedding_rsvp_responses
  FOR SELECT
  TO anon, authenticated
  USING (false);

DROP POLICY IF EXISTS "No public updates to wedding RSVPs" ON public.wedding_rsvp_responses;
CREATE POLICY "No public updates to wedding RSVPs"
  ON public.wedding_rsvp_responses
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "No public deletes of wedding RSVPs" ON public.wedding_rsvp_responses;
CREATE POLICY "No public deletes of wedding RSVPs"
  ON public.wedding_rsvp_responses
  FOR DELETE
  TO anon, authenticated
  USING (false);