
-- User aliases (anonymous nicknames)
CREATE TABLE public.user_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create aliases" ON public.user_aliases FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read aliases" ON public.user_aliases FOR SELECT USING (true);

-- Tools registry
CREATE TABLE public.tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  vendor TEXT,
  link TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read tools" ON public.tools FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tools" ON public.tools FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tools" ON public.tools FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tools" ON public.tools FOR DELETE USING (true);

-- Models registry
CREATE TABLE public.models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT,
  modality TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read models" ON public.models FOR SELECT USING (true);
CREATE POLICY "Anyone can insert models" ON public.models FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update models" ON public.models FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete models" ON public.models FOR DELETE USING (true);

-- Submissions (survey responses)
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_id UUID REFERENCES public.user_aliases(id),
  team TEXT,
  role TEXT,
  tools_used TEXT[] DEFAULT '{}',
  tools_freetext TEXT,
  models_used TEXT[] DEFAULT '{}',
  use_cases TEXT[] DEFAULT '{}',
  time_saved_range TEXT,
  data_sensitivity TEXT,
  pain_points TEXT,
  must_keep_tool TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read submissions" ON public.submissions FOR SELECT USING (true);

-- Evaluations (admin decisions)
CREATE TABLE public.evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES public.tools(id),
  model_id UUID REFERENCES public.models(id),
  value_score INTEGER,
  risk_score INTEGER,
  cost_score INTEGER,
  decided_status TEXT NOT NULL DEFAULT 'ALLOWED' CHECK (decided_status IN ('STANDARD', 'ALLOWED', 'NOT_ALLOWED', 'TRIAL')),
  rationale TEXT,
  version TEXT DEFAULT 'v1',
  decided_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read evaluations" ON public.evaluations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert evaluations" ON public.evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update evaluations" ON public.evaluations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete evaluations" ON public.evaluations FOR DELETE USING (true);

-- Catalog entries
CREATE TABLE public.catalog_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES public.tools(id),
  model_id UUID REFERENCES public.models(id),
  best_for TEXT,
  recommended_models TEXT,
  do_this TEXT,
  avoid_this TEXT,
  example_prompts TEXT,
  security_guidance TEXT,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read catalog" ON public.catalog_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert catalog" ON public.catalog_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update catalog" ON public.catalog_entries FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete catalog" ON public.catalog_entries FOR DELETE USING (true);

-- Learning items
CREATE TABLE public.learning_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'tip',
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  submitted_by UUID REFERENCES public.user_aliases(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.learning_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published learning" ON public.learning_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert learning" ON public.learning_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update learning" ON public.learning_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete learning" ON public.learning_items FOR DELETE USING (true);

-- Votes (nice-to-have)
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_id UUID REFERENCES public.user_aliases(id),
  tool_id UUID,
  learning_item_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.votes FOR INSERT WITH CHECK (true);
