import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, type, provider, category, modality } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextParts = [`Navn: ${name}`, `Type: ${type === "model" ? "AI-modell" : "AI-verktøy"}`];
    if (provider) contextParts.push(`Leverandør: ${provider}`);
    if (category) contextParts.push(`Kategori: ${category}`);
    if (modality) contextParts.push(`Modalitet: ${modality}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
  "category": "Kort kategori for verktøyet/modellen (f.eks. Kodehjelp, Chatbot, Bildegenerering, Skriveassistent, Produktivitet)",
  "vendor": "Leverandørens/selskapets offisielle navn",
  "link": "Offisiell URL til verktøyet/modellen (https://...)",
  "best_for": "Kort beskrivelse av hva verktøyet/modellen er best egnet for (1-2 setninger)",
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
                  category: { type: "string" },
                  vendor: { type: "string" },
                  link: { type: "string" },
                  best_for: { type: "string" },
                  example_prompts: { type: "string" },
                  do_this: { type: "string" },
                  avoid_this: { type: "string" },
                  security_guidance: { type: "string" },
                },
                required: ["category", "vendor", "link", "best_for", "example_prompts", "do_this", "avoid_this", "security_guidance"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "catalog_entry" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler, prøv igjen om litt." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kreditter oppbrukt." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let result;
    if (toolCall) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content as JSON
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response");
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-catalog-info error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
