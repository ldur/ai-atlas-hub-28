import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifySessionToken } from "../_shared/adminAuth.ts";

// Columns safe to expose for aggregated insights (no free-text, no alias linkage)
const PUBLIC_COLUMNS = "id, survey_id, created_at, tools_used, models_used, use_cases, time_saved_range, data_sensitivity";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing environment variables");

    const isAdmin = await verifySessionToken(req.headers.get("x-admin-token"));
    const body = await req.json().catch(() => ({}));
    const surveyId = typeof body?.surveyId === "string" && body.surveyId !== "all" ? body.surveyId : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let query = supabase
      .from("submissions")
      .select(isAdmin ? "*" : PUBLIC_COLUMNS)
      .order("created_at", { ascending: false });
    if (surveyId) query = query.eq("survey_id", surveyId);

    const { data, error } = await query;
    if (error) throw error;

    return json({ submissions: data ?? [], admin: isAdmin });
  } catch (e) {
    console.error("read-submissions error:", e);
    return json({ error: "Kunne ikke hente innleveringer." }, 500);
  }
});
