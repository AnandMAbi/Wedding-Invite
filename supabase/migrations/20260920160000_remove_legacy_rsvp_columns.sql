-- These fields belonged to the original RSVP form and are no longer collected.

ALTER TABLE public.wedding_rsvp_responses
  DROP COLUMN IF EXISTS ceremony,
  DROP COLUMN IF EXISTS reception,
  DROP COLUMN IF EXISTS dietary_requirements;
