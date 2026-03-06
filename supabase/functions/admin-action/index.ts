import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_CODE = "atlas-admin-2024";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminToken = req.headers.get("x-admin-token");
    if (adminToken !== ADMIN_CODE) {
      return new Response(JSON.stringify({ error: "Uautorisert. Ugyldig admin-kode." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action, table, payload, id } = body;

    // Only allow specific tables
    const allowedTables = ["catalog_entries", "evaluations", "tools", "models", "learning_items", "submissions", "shared_links", "pricing_configs", "org_usage_params"];
    if (!allowedTables.includes(table)) {
      return new Response(JSON.stringify({ error: `Tabell '${table}' er ikke tillatt.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;

    switch (action) {
      case "insert": {
        const { data, error } = await supabase.from(table).insert(payload).select().single();
        if (error) throw error;
        result = data;
        break;
      }
      case "update": {
        if (!id) throw new Error("ID er påkrevd for oppdatering");
        const { data, error } = await supabase.from(table).update(payload).eq("id", id).select().single();
        if (error) throw error;
        result = data;
        break;
      }
      case "delete": {
        if (!id) throw new Error("ID er påkrevd for sletting");
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        result = { deleted: true };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `Ukjent handling: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-action error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
