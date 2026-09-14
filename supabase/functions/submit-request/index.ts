import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/adminAuth.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.slice(0, max);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing environment variables");

    const body = await req.json().catch(() => ({}));
    const type = body?.type === "model" ? "model" : "tool";
    const name = clean(body?.name, 200);
    const vendor = clean(body?.vendor, 200);
    const link = clean(body?.link, 2000);
    const reason = clean(body?.reason, 5000);

    if (!name) return json({ error: "Navn er påkrevd." }, 400);
    if (link && !/^https?:\/\//i.test(link)) return json({ error: "Lenken må starte med http:// eller https://" }, 400);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let toolId: string | null = null;
    let modelId: string | null = null;

    if (type === "tool") {
      const { data, error } = await supabase
        .from("tools")
        .insert({ name, vendor, link, notes: reason })
        .select("id")
        .single();
      if (error) throw error;
      toolId = data.id;
    } else {
      const { data, error } = await supabase
        .from("models")
        .insert({ name, provider: vendor, link, notes: reason })
        .select("id")
        .single();
      if (error) throw error;
      modelId = data.id;
    }

    const { error: evalError } = await supabase.from("evaluations").insert({
      tool_id: toolId,
      model_id: modelId,
      decided_status: "TRIAL",
      rationale: null,
      version: "request",
    });
    if (evalError) throw evalError;

    return json({ ok: true });
  } catch (e) {
    console.error("submit-request error:", e);
    return json({ error: "Kunne ikke sende forespørselen." }, 500);
  }
});
