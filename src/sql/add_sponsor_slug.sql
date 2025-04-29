
-- Add slug column to sponsors table if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sponsors' 
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.sponsors 
    ADD COLUMN slug text;
  END IF;
END $$;

-- Create index on slug column for faster lookups
CREATE INDEX IF NOT EXISTS sponsors_slug_idx ON public.sponsors (slug);

-- Update existing sponsors that don't have a slug
UPDATE public.sponsors
SET slug = LOWER(
  REPLACE(
    REPLACE(
      CONCAT(first_name, '-', last_name), 
      ' ', '-'
    ), 
    '''', ''
  )
)
WHERE slug IS NULL;
