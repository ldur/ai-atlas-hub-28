
-- Add question configuration to surveys
ALTER TABLE public.surveys ADD COLUMN enabled_questions jsonb NOT NULL DEFAULT '["tools","models","use_cases","time_saved","data_sensitivity","pain_points","must_keep"]'::jsonb;
ALTER TABLE public.surveys ADD COLUMN custom_questions jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add custom answers storage to submissions
ALTER TABLE public.submissions ADD COLUMN custom_answers jsonb DEFAULT '{}'::jsonb;

-- Update existing survey to have all questions enabled
UPDATE public.surveys SET enabled_questions = '["tools","models","use_cases","time_saved","data_sensitivity","pain_points","must_keep"]'::jsonb WHERE id = '00000000-0000-0000-0000-000000000001';
