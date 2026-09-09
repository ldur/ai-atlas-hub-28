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

    const isModel = type === "model";
    const contextParts = [
      isModel ? `Modellfamilie: ${name}` : `Navn: ${name}`,
      `Type: ${isModel ? "AI-modellfamilie" : "AI-verktøy"}`,
    ];
    if (provider) contextParts.push(`Leverandør: ${provider}`);
    if (category) contextParts.push(`Kategori: ${category}`);
    if (modality) contextParts.push(`Modalitet: ${modality}`);

    const systemPrompt = `Du er en AI-rådgiver for en norsk organisasjon som kartlegger AI-verktøy og modellfamilier.

ARBEIDSMÅTE:
- Bruk ALLTID web_search-verktøyet først for å finne oppdatert informasjon om det eksakte navnet. Din interne kunnskap kan være utdatert; nye modeller og verktøy lanseres hele tiden.
- Søk gjerne flere ganger (navnet alene, navnet + leverandør, navnet + "documentation"/"pricing"/"release").
- Bygg svaret på det du faktisk finner i søkeresultatene, og bruk leverandørens offisielle side som lenke når du finner den.

KRITISKE REGLER:
1. Du skriver KUN om det eksakte navnet brukeren oppgir. Erstatt det ALDRI med en annen modell/verktøy med lignende navn.
${isModel ? `2. Navnet er en MODELLFAMILIE (f.eks. GPT-5, Claude, Gemini, Llama), ikke én enkelt versjon. Beskriv familien som helhet: bruksområder, typiske varianter (lette/raske vs. store/resonnerende) og styrker/svakheter på familienivå.
` : ""}3. Sett "uncertain": true KUN hvis søk heller ikke gir troverdig informasjon om navnet. Da: ikke dikt opp fakta, versjonsnumre, priser eller lenker, og la "link" og "vendor" stå tomme.
4. Ikke oppgi presise ytelsestall eller priser du ikke har dekning for i søkeresultatene.
5. Alt innhold på norsk, kort og konkret.`;

    const schema = {
      type: "object",
      additionalProperties: false,
      properties: {
        category: { type: "string", description: isModel ? "Kort modalitet/kategori for familien (f.eks. Tekst, Tekst og bilde, Kode)" : "Kort kategori (f.eks. Kodehjelp, Chatbot, Bildegenerering)" },
        vendor: { type: "string", description: "Leverandørens offisielle navn, eller tom streng hvis usikker" },
        link: { type: "string", description: "Offisiell URL (https://...), eller tom streng hvis usikker" },
        best_for: { type: "string", description: `Hva ${isModel ? "denne modellfamilien" : "dette verktøyet"} er best egnet for (1-3 setninger)` },
        uncertain: { type: "boolean" },
        uncertainty_note: { type: "string", description: "Kort merknad hvis usikker, ellers tom streng" },
      },
      required: ["category", "vendor", "link", "best_for", "uncertain", "uncertainty_note"],
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-5.5",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        tools: [{ type: "web_search" }],
        text: { format: { type: "json_schema", name: "catalog_entry", strict: true, schema } },
        input: [
          { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
          {
            role: "user",
            content: [{
              type: "input_text",
              text: `Søk på nett og generer katalogoppføring (json) for nøyaktig ${isModel ? "denne modellfamilien" : "dette navnet"} (ikke bytt til noe annet):\n${contextParts.join("\n")}`,
            }],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørsler, prøv igjen om litt." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kreditter er oppbrukt. Legg til kreditter i Lovable for å bruke AI-generering." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 403) {
        const raw = await response.text();
        console.error("AI gateway 403:", raw);
        let message = "AI-generering er blokkert av arbeidsområdets innstillinger.";
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.details || parsed?.message) message = parsed.details || parsed.message;
        } catch (_) { /* keep default */ }
        return new Response(JSON.stringify({ error: message }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error (${response.status})`);
    }

    // Read the SSE stream and accumulate the output text.
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
            content += evt.delta;
          } else if (evt.type === "response.completed" && !content) {
            content = evt.response?.output_text || "";
          }
        } catch (_) { /* ignore non-JSON keepalives */ }
      }
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Unparsable AI content:", content.slice(0, 500));
      throw new Error("Could not parse AI response");
    }
    const result = JSON.parse(jsonMatch[0]);

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
