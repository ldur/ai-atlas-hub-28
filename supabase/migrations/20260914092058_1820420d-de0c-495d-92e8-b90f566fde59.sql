-- CATALOG_ENTRIES
DROP POLICY IF EXISTS "Anyone can insert catalog" ON public.catalog_entries;
DROP POLICY IF EXISTS "Anyone can update catalog" ON public.catalog_entries;
DROP POLICY IF EXISTS "Anyone can delete catalog" ON public.catalog_entries;
REVOKE INSERT, UPDATE, DELETE ON public.catalog_entries FROM anon, authenticated;
GRANT ALL ON public.catalog_entries TO service_role;

-- EVALUATIONS
DROP POLICY IF EXISTS "Anyone can insert evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Anyone can update evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Anyone can delete evaluations" ON public.evaluations;
REVOKE INSERT, UPDATE, DELETE ON public.evaluations FROM anon, authenticated;
GRANT ALL ON public.evaluations TO service_role;

-- TOOLS
DROP POLICY IF EXISTS "Anyone can insert tools" ON public.tools;
DROP POLICY IF EXISTS "Anyone can update tools" ON public.tools;
DROP POLICY IF EXISTS "Anyone can delete tools" ON public.tools;
REVOKE INSERT, UPDATE, DELETE ON public.tools FROM anon, authenticated;
GRANT ALL ON public.tools TO service_role;

-- MODELS
DROP POLICY IF EXISTS "Anyone can insert models" ON public.models;
DROP POLICY IF EXISTS "Anyone can update models" ON public.models;
DROP POLICY IF EXISTS "Anyone can delete models" ON public.models;
REVOKE INSERT, UPDATE, DELETE ON public.models FROM anon, authenticated;
GRANT ALL ON public.models TO service_role;

-- ORG_USAGE_PARAMS
DROP POLICY IF EXISTS "Anyone can insert org_usage_params" ON public.org_usage_params;
DROP POLICY IF EXISTS "Anyone can update org_usage_params" ON public.org_usage_params;
DROP POLICY IF EXISTS "Anyone can delete org_usage_params" ON public.org_usage_params;
REVOKE INSERT, UPDATE, DELETE ON public.org_usage_params FROM anon, authenticated;
GRANT ALL ON public.org_usage_params TO service_role;

-- PRICING_CONFIGS
DROP POLICY IF EXISTS "Anyone can insert pricing_configs" ON public.pricing_configs;
DROP POLICY IF EXISTS "Anyone can update pricing_configs" ON public.pricing_configs;
DROP POLICY IF EXISTS "Anyone can delete pricing_configs" ON public.pricing_configs;
REVOKE INSERT, UPDATE, DELETE ON public.pricing_configs FROM anon, authenticated;
GRANT ALL ON public.pricing_configs TO service_role;

-- SURVEYS
DROP POLICY IF EXISTS "Anyone can insert surveys" ON public.surveys;
DROP POLICY IF EXISTS "Anyone can update surveys" ON public.surveys;
DROP POLICY IF EXISTS "Anyone can delete surveys" ON public.surveys;
REVOKE INSERT, UPDATE, DELETE ON public.surveys FROM anon, authenticated;
GRANT ALL ON public.surveys TO service_role;

-- LEARNING_ITEMS
DROP POLICY IF EXISTS "Anyone can update learning" ON public.learning_items;
DROP POLICY IF EXISTS "Anyone can delete learning" ON public.learning_items;
DROP POLICY IF EXISTS "Anyone can insert learning" ON public.learning_items;
DROP POLICY IF EXISTS "Anyone can read published learning" ON public.learning_items;
REVOKE UPDATE, DELETE ON public.learning_items FROM anon, authenticated;
GRANT SELECT, INSERT ON public.learning_items TO anon, authenticated;
GRANT ALL ON public.learning_items TO service_role;
CREATE POLICY "Public can read published learning"
  ON public.learning_items FOR SELECT
  USING (published = true);
CREATE POLICY "Public can submit learning"
  ON public.learning_items FOR INSERT
  WITH CHECK (
    published = true
    AND type IN ('tip','show-tell','prompt-pack','guideline','case-study')
    AND char_length(title) BETWEEN 1 AND 200
    AND (content IS NULL OR char_length(content) <= 10000)
    AND (submitted_by IS NULL OR EXISTS (SELECT 1 FROM public.user_aliases ua WHERE ua.id = submitted_by))
  );

-- SHARED_LINKS
DROP POLICY IF EXISTS "Anyone can update links" ON public.shared_links;
DROP POLICY IF EXISTS "Anyone can delete links" ON public.shared_links;
DROP POLICY IF EXISTS "Anyone can insert links" ON public.shared_links;
DROP POLICY IF EXISTS "Anyone can read published links" ON public.shared_links;
REVOKE UPDATE, DELETE ON public.shared_links FROM anon, authenticated;
GRANT SELECT, INSERT ON public.shared_links TO anon, authenticated;
GRANT ALL ON public.shared_links TO service_role;
CREATE POLICY "Public can read published links"
  ON public.shared_links FOR SELECT
  USING (published = true);
CREATE POLICY "Public can submit links"
  ON public.shared_links FOR INSERT
  WITH CHECK (
    published = true
    AND url ~* '^https?://'
    AND char_length(url) <= 2000
    AND (title IS NULL OR char_length(title) <= 300)
    AND (description IS NULL OR char_length(description) <= 2000)
    AND (submitted_by IS NULL OR EXISTS (SELECT 1 FROM public.user_aliases ua WHERE ua.id = submitted_by))
  );

-- SUBMISSIONS
DROP POLICY IF EXISTS "Anyone can read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can create submissions" ON public.submissions;
REVOKE SELECT, UPDATE, DELETE ON public.submissions FROM anon, authenticated;
GRANT INSERT ON public.submissions TO anon, authenticated;
GRANT ALL ON public.submissions TO service_role;
CREATE POLICY "Public can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    alias_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.user_aliases ua WHERE ua.id = alias_id)
    AND (survey_id IS NULL OR EXISTS (SELECT 1 FROM public.surveys s WHERE s.id = survey_id))
    AND (pain_points IS NULL OR char_length(pain_points) <= 5000)
    AND (tools_freetext IS NULL OR char_length(tools_freetext) <= 2000)
  );

-- USER_ALIASES
DROP POLICY IF EXISTS "Anyone can create aliases" ON public.user_aliases;
CREATE POLICY "Public can create aliases"
  ON public.user_aliases FOR INSERT
  WITH CHECK (char_length(btrim(nickname)) BETWEEN 2 AND 40);

-- VOTES
DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;
CREATE POLICY "Public can insert votes"
  ON public.votes FOR INSERT
  WITH CHECK (
    alias_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.user_aliases ua WHERE ua.id = alias_id)
    AND ((tool_id IS NOT NULL AND learning_item_id IS NULL) OR (tool_id IS NULL AND learning_item_id IS NOT NULL))
  );