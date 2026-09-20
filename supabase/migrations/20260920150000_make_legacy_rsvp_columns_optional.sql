-- The invitation now collects Fusion Party, Sangeet, Wedding, and
-- accommodation responses instead of the original ceremony/reception fields.
-- Keep the original columns for existing data, but make them optional so new
-- submissions from the current form can be saved.

ALTER TABLE public.wedding_rsvp_responses
  ALTER COLUMN ceremony DROP NOT NULL,
  ALTER COLUMN reception DROP NOT NULL,
  ALTER COLUMN dietary_requirements DROP NOT NULL;
