
-- Function to get sponsor relatives
CREATE OR REPLACE FUNCTION public.get_sponsor_relatives(sponsor_id_param UUID)
RETURNS SETOF public.sponsor_relatives
LANGUAGE sql
AS $$
  SELECT * 
  FROM public.sponsor_relatives
  WHERE sponsor_id = sponsor_id_param
  ORDER BY created_at DESC;
$$;

-- Function to get sponsor timeline events
CREATE OR REPLACE FUNCTION public.get_sponsor_timeline_events(sponsor_id_param UUID)
RETURNS SETOF public.sponsor_timeline_events
LANGUAGE sql
AS $$
  SELECT * 
  FROM public.sponsor_timeline_events
  WHERE sponsor_id = sponsor_id_param
  ORDER BY date DESC;
$$;
