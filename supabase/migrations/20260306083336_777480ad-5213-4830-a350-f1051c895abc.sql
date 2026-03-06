
-- pricing_configs table
CREATE TABLE public.pricing_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE,
  model_id uuid REFERENCES public.models(id) ON DELETE CASCADE,
  pricing_type text NOT NULL DEFAULT 'flat',
  currency text NOT NULL DEFAULT 'USD',
  tiers jsonb DEFAULT '[]'::jsonb,
  input_token_price numeric,
  output_token_price numeric,
  notes text,
  ai_generated boolean DEFAULT false,
  last_fetched timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read pricing_configs" ON public.pricing_configs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert pricing_configs" ON public.pricing_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update pricing_configs" ON public.pricing_configs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete pricing_configs" ON public.pricing_configs FOR DELETE USING (true);

-- org_usage_params table (single-row config)
CREATE TABLE public.org_usage_params (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  num_seats integer NOT NULL DEFAULT 10,
  monthly_api_calls integer NOT NULL DEFAULT 0,
  monthly_input_tokens bigint NOT NULL DEFAULT 0,
  monthly_output_tokens bigint NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_usage_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read org_usage_params" ON public.org_usage_params FOR SELECT USING (true);
CREATE POLICY "Anyone can insert org_usage_params" ON public.org_usage_params FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update org_usage_params" ON public.org_usage_params FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete org_usage_params" ON public.org_usage_params FOR DELETE USING (true);

-- Insert default org params row
INSERT INTO public.org_usage_params (num_seats, monthly_api_calls, monthly_input_tokens, monthly_output_tokens, notes)
VALUES (10, 1000, 1000000, 500000, '');
