import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import ReactMarkdown from "react-markdown";

const Catalog = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("catalog_entries").select("*"),
      supabase.from("tools").select("*"),
    ]).then(([catRes, toolRes]) => {
      setEntries(catRes.data || []);
      setTools(toolRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">Laster katalog...</p>;

  const getToolName = (toolId: string) => tools.find((t) => t.id === toolId)?.name || "Ukjent";
  const getToolCategory = (toolId: string) => tools.find((t) => t.id === toolId)?.category;

  const filtered = entries.filter((e) => {
    const toolName = e.tool_id ? getToolName(e.tool_id) : "";
    return toolName.toLowerCase().includes(search.toLowerCase()) ||
      (e.best_for || "").toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verktøykatalog</h1>
        <p className="text-muted-foreground">Søkbar oversikt over AI-verktøy og bruksveiledninger</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk i katalogen..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          {entries.length === 0 ? "Katalogen er tom. Admin kan legge til oppføringer." : "Ingen treff."}
        </p>
      )}

      <div className="space-y-4">
        {filtered.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{entry.tool_id ? getToolName(entry.tool_id) : "Generelt"}</CardTitle>
                {entry.tool_id && getToolCategory(entry.tool_id) && (
                  <Badge variant="secondary">{getToolCategory(entry.tool_id)}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {entry.best_for && (
                <div>
                  <p className="font-medium text-foreground">Best for</p>
                  <p className="text-muted-foreground">{entry.best_for}</p>
                </div>
              )}
              {entry.example_prompts && (
                <div>
                  <p className="font-medium text-foreground">Eksempelprompter</p>
                  <div className="prose-catalog text-muted-foreground">
                    <ReactMarkdown>{entry.example_prompts}</ReactMarkdown>
                  </div>
                </div>
              )}
              {entry.do_this && (
                <div>
                  <p className="font-medium text-success">✅ Gjør dette</p>
                  <p className="text-muted-foreground">{entry.do_this}</p>
                </div>
              )}
              {entry.avoid_this && (
                <div>
                  <p className="font-medium text-destructive">❌ Unngå dette</p>
                  <p className="text-muted-foreground">{entry.avoid_this}</p>
                </div>
              )}
              {entry.security_guidance && (
                <div>
                  <p className="font-medium text-foreground">🔒 Sikkerhetsveiledning</p>
                  <p className="text-muted-foreground">{entry.security_guidance}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Catalog;
