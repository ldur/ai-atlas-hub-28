import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 3;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all models
    const { data: models, error: modelsErr } = await supabase.from("models").select("*");
    if (modelsErr) throw modelsErr;

    // Get existing catalog entries for models
    const { data: existing, error: catErr } = await supabase
      .from("catalog_entries")
      .select("model_id")
      .not("model_id", "is", null);
    if (catErr) throw catErr;

    const existingModelIds = new Set((existing || []).map((e: any) => e.model_id));
    const allMissing = (models || []).filter((m: any) => !existingModelIds.has(m.id));
    const missing = allMissing.slice(0, batchSize);

    console.log(`Found ${allMissing.length} models without catalog entries, processing ${missing.length}`);

    const results: { name: string; status: string }[] = [];

    for (const model of missing) {
      try {
        console.log(`Generating for: ${model.name}`);

        const contextParts = [`Navn: ${model.name}`, `Type: AI-modell`];
        if (model.provider) contextParts.push(`Leverandør: ${model.provider}`);
        if (model.modality) contextParts.push(`Modalitet: ${model.modality}`);

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Du er en AI-rådgiver for en norsk organisasjon som kartlegger og evaluerer AI-verktøy og modeller.
Gi praktisk, konkret veiledning på norsk. Svar ALLTID som gyldig JSON med disse nøklene:
{
  "best_for": "Kort beskrivelse av hva modellen er best egnet for (1-2 setninger)",
  "example_prompts": "3-5 eksempelprompter i markdown-liste format som viser god bruk",
  "do_this": "2-3 konkrete tips for god bruk (kort tekst)",
  "avoid_this": "2-3 ting man bør unngå (kort tekst)",
  "security_guidance": "Kort sikkerhetsveiledning relevant for enterprise-bruk (1-2 setninger)"
}
Ingen annen tekst utenfor JSON-objektet.`,
              },
              {
                role: "user",
                content: `Generer katalogoppføring for:\n${contextParts.join("\n")}`,
              },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "catalog_entry",
                  description: "Return structured catalog entry info",
                  parameters: {
                    type: "object",
                    properties: {
                      best_for: { type: "string" },
                      example_prompts: { type: "string" },
                      do_this: { type: "string" },
                      avoid_this: { type: "string" },
                      security_guidance: { type: "string" },
                    },
                    required: ["best_for", "example_prompts", "do_this", "avoid_this", "security_guidance"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "catalog_entry" } },
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`AI error for ${model.name}: ${aiResponse.status} ${errText}`);
          results.push({ name: model.name, status: `AI error: ${aiResponse.status}` });
          // Wait a bit to avoid rate limiting
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

        let generated;
        if (toolCall) {
          generated = JSON.parse(toolCall.function.arguments);
        } else {
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            generated = JSON.parse(jsonMatch[0]);
          } else {
            results.push({ name: model.name, status: "Could not parse AI response" });
            continue;
          }
        }

        // Save to database
        const { error: insertErr } = await supabase.from("catalog_entries").insert({
          model_id: model.id,
          best_for: generated.best_for || "",
          example_prompts: generated.example_prompts || "",
          do_this: generated.do_this || "",
          avoid_this: generated.avoid_this || "",
          security_guidance: generated.security_guidance || "",
          last_updated: new Date().toISOString(),
        });

        if (insertErr) {
          results.push({ name: model.name, status: `DB error: ${insertErr.message}` });
        } else {
          results.push({ name: model.name, status: "success" });
        }

        // Delay between requests to avoid rate limiting
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        console.error(`Error for ${model.name}:`, e);
        results.push({ name: model.name, status: `Error: ${e instanceof Error ? e.message : "unknown"}` });
      }
    }

    return new Response(JSON.stringify({ processed: missing.length, remaining: allMissing.length - missing.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bulk-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
