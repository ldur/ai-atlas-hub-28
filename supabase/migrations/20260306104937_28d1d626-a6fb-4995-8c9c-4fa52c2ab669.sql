
-- Create surveys table
CREATE TABLE public.surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- RLS policies for surveys (public read, admin write via edge function)
CREATE POLICY "Anyone can read surveys" ON public.surveys FOR SELECT USING (true);
CREATE POLICY "Anyone can insert surveys" ON public.surveys FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update surveys" ON public.surveys FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete surveys" ON public.surveys FOR DELETE USING (true);

-- Add survey_id to submissions
ALTER TABLE public.submissions ADD COLUMN survey_id uuid REFERENCES public.surveys(id) ON DELETE SET NULL;

-- Insert the first survey (the current hardcoded one)
INSERT INTO public.surveys (id, title, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'AI-verktøy kartlegging', 'Del hvilke AI-verktøy og modeller du bruker', true);

-- Link all existing submissions to this first survey
UPDATE public.submissions SET survey_id = '00000000-0000-0000-0000-000000000001' WHERE survey_id IS NULL;
