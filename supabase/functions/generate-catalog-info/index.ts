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

KRITISKE REGLER:
1. Du skriver KUN om det eksakte navnet brukeren oppgir. Du skal ALDRI erstatte det med, eller beskrive, en annen modell/verktøy med lignende navn (f.eks. ikke svar om "Claude 3.5 Sonnet" hvis navnet er "Claude Fable").
${isModel ? `2. Navnet er en MODELLFAMILIE (f.eks. GPT-5, Claude, Gemini, Llama), ikke én enkelt versjon. Beskriv familien som helhet: hva den brukes til, hvilke typer varianter den vanligvis har (f.eks. lette/raske vs. store/resonnerende), og styrker/svakheter på familienivå. Ikke lås innholdet til én bestemt versjon, og ikke oppgi presise versjonsnumre, ytelsestall eller priser du ikke er sikker på.
` : ""}3. Hvis du ikke sikkert kjenner dette navnet, sett "uncertain": true og "uncertainty_note" til en kort forklaring på norsk. Ikke dikt opp fakta, versjonsnumre, priser eller lenker. La "link" og "vendor" stå tomme hvis du ikke er sikker.
4. Når du er usikker: skriv generisk, forsiktig veiledning basert på navnet/leverandøren og typen (${isModel ? "modellfamilie" : "verktøy"}), og gjør det tydelig i teksten at det må verifiseres mot leverandørens dokumentasjon.
5. Eksempelprompter skal være konkrete og relevante for bruksområdet, formatert som markdown-liste.
6. Alt innhold på norsk.

Svar KUN med ett gyldig JSON-objekt, uten kodeblokk eller annen tekst:
{
  "category": "${isModel ? "Kort modalitet/kategori for familien (f.eks. Tekst, Tekst og bilde, Kode)" : "Kort kategori (f.eks. Kodehjelp, Chatbot, Bildegenerering, Skriveassistent)"}",
  "vendor": "Leverandørens offisielle navn, eller tom streng hvis usikker",
  "link": "Offisiell URL (https://...), eller tom streng hvis usikker",
  "best_for": "Hva ${isModel ? "denne modellfamilien" : "dette"} er best egnet for (1-2 setninger)",
  "example_prompts": "3-5 eksempelprompter som markdown-liste",
  "do_this": "2-3 konkrete tips for god bruk",
  "avoid_this": "2-3 ting man bør unngå",
  "security_guidance": "Kort sikkerhetsveiledning for enterprise-bruk (1-2 setninger)",
  "uncertain": true eller false,
  "uncertainty_note": "Kort merknad hvis usikker, ellers tom streng"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        reasoning_effort: "low",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generer katalogoppføring for nøyaktig ${isModel ? "denne modellfamilien" : "dette navnet"} (ikke bytt til en annen ${isModel ? "modellfamilie" : "modell/verktøy"}):\n${contextParts.join("\n")}`,
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
        return new Response(JSON.stringify({ error: "AI-kreditter oppbrukt." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
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
