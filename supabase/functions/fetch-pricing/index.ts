import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const adminToken = req.headers.get("x-admin-token");
    if (adminToken !== "atlas-admin-2024") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { name, type, vendor, link, tool_id, model_id } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a pricing research assistant. Given an AI tool or model name, vendor, and optional link, return structured pricing information based on your knowledge.

Return pricing data by calling the store_pricing function. Be accurate about real vendor pricing. If you're unsure, use your best estimate and note uncertainty.

For AI models (like GPT-4, Claude, Gemini), use pricing_type "per_token" and provide input/output token prices per 1M tokens in USD.
For SaaS tools (like GitHub Copilot, Notion AI), use pricing_type "per_seat" or "tiered" with tier details.
For free tools, use pricing_type "free".
For flat-rate subscriptions, use pricing_type "flat".`;

    const userPrompt = `Research the pricing for: "${name}"
Type: ${type}
${vendor ? `Vendor/Provider: ${vendor}` : ""}
${link ? `Website: ${link}` : ""}

Provide the current pricing structure.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "store_pricing",
              description: "Store structured pricing data for a tool or model",
              parameters: {
                type: "object",
                properties: {
                  pricing_type: {
                    type: "string",
                    enum: ["per_seat", "per_token", "flat", "tiered", "usage_based", "free"],
                    description: "The pricing model type",
                  },
                  currency: { type: "string", default: "USD" },
                  tiers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        price: { type: "number" },
                        unit: { type: "string" },
                        features: { type: "array", items: { type: "string" } },
                      },
                      required: ["name", "price", "unit"],
                    },
                    description: "Pricing tiers/plans",
                  },
                  input_token_price: {
                    type: "number",
                    description: "Price per 1M input tokens in USD (for per_token models)",
                  },
                  output_token_price: {
                    type: "number",
                    description: "Price per 1M output tokens in USD (for per_token models)",
                  },
                  notes: { type: "string", description: "Additional pricing notes or caveats" },
                },
                required: ["pricing_type", "currency"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "store_pricing" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return structured pricing data");
    }

    const pricing = JSON.parse(toolCall.function.arguments);

    // Store in database
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Upsert: delete existing config for this tool/model, then insert new
    if (tool_id) {
      await supabase.from("pricing_configs").delete().eq("tool_id", tool_id);
    }
    if (model_id) {
      await supabase.from("pricing_configs").delete().eq("model_id", model_id);
    }

    const { data, error } = await supabase.from("pricing_configs").insert({
      tool_id: tool_id || null,
      model_id: model_id || null,
      pricing_type: pricing.pricing_type,
      currency: pricing.currency || "USD",
      tiers: pricing.tiers || [],
      input_token_price: pricing.input_token_price || null,
      output_token_price: pricing.output_token_price || null,
      notes: pricing.notes || null,
      ai_generated: true,
      last_fetched: new Date().toISOString(),
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-pricing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
