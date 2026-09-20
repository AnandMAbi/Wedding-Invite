/*
# Expand wedding RSVP responses for roomie matchmaking and event attendance

1. New Columns
- `tribe` stores the guest's selected friend group.
- `tribe_other` stores a custom friend group when the guest selects Others.
- `fusion_party`, `sangeet`, and `wedding` store yes/no attendance answers for each event.
- `staying_over` stores whether the guest needs accommodation at the venue.
- `accommodation_11th`, `accommodation_12th`, and `accommodation_13th` store yes/no accommodation needs for each night.

2. Modified Tables
- `wedding_rsvp_responses` receives nullable columns so all previously submitted RSVPs remain valid and readable by existing systems.

3. Security
- Existing row level security remains enabled.
- Existing public insert-only access remains in place.
- No public read, update, or delete access is added.

4. Important Notes
- New columns are intentionally nullable for backward compatibility with responses submitted before the updated guest form.
- The invitation continues to accept submissions without requiring sign-in.
*/

ALTER TABLE public.wedding_rsvp_responses
  ADD COLUMN IF NOT EXISTS tribe text,
  ADD COLUMN IF NOT EXISTS tribe_other text,
  ADD COLUMN IF NOT EXISTS fusion_party text,
  ADD COLUMN IF NOT EXISTS sangeet text,
  ADD COLUMN IF NOT EXISTS wedding text,
  ADD COLUMN IF NOT EXISTS staying_over text,
  ADD COLUMN IF NOT EXISTS accommodation_11th text,
  ADD COLUMN IF NOT EXISTS accommodation_12th text,
  ADD COLUMN IF NOT EXISTS accommodation_13th text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'wedding_rsvp_responses_new_answers_check'
  ) THEN
    ALTER TABLE public.wedding_rsvp_responses
      ADD CONSTRAINT wedding_rsvp_responses_new_answers_check CHECK (
        (tribe IS NULL OR tribe IN ('IIM K', 'PhonePe', 'GVP', 'Bethany', 'Castrol', 'Others')) AND
        (fusion_party IS NULL OR fusion_party IN ('yes', 'no')) AND
        (sangeet IS NULL OR sangeet IN ('yes', 'no')) AND
        (wedding IS NULL OR wedding IN ('yes', 'no')) AND
        (staying_over IS NULL OR staying_over IN ('yes', 'no')) AND
        (accommodation_11th IS NULL OR accommodation_11th IN ('yes', 'no')) AND
        (accommodation_12th IS NULL OR accommodation_12th IN ('yes', 'no')) AND
        (accommodation_13th IS NULL OR accommodation_13th IN ('yes', 'no'))
      );
  END IF;
END $$;