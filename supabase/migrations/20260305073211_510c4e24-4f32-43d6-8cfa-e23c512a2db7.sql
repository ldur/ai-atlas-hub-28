
CREATE TABLE public.shared_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  title text,
  description text,
  submitted_by uuid REFERENCES public.user_aliases(id),
  published boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published links" ON public.shared_links
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert links" ON public.shared_links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update links" ON public.shared_links
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete links" ON public.shared_links
  FOR DELETE USING (true);
