UPDATE public.tools t
SET notes = COALESCE(NULLIF(t.notes, ''), e.rationale)
FROM public.evaluations e
WHERE e.tool_id = t.id AND e.version = 'request' AND e.rationale IS NOT NULL;

UPDATE public.models m
SET notes = COALESCE(NULLIF(m.notes, ''), e.rationale)
FROM public.evaluations e
WHERE e.model_id = m.id AND e.version = 'request' AND e.rationale IS NOT NULL;

UPDATE public.evaluations SET rationale = NULL WHERE version = 'request';