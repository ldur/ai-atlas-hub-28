import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { CatalogEntryEditor } from "@/components/CatalogEntryEditor";

const statusConfig: Record<string, { label: string; color: string }> = {
  STANDARD: { label: "🟢 Standard", color: "bg-success text-success-foreground" },
  ALLOWED: { label: "🟡 Tillatt ved behov", color: "bg-warning text-warning-foreground" },
  NOT_ALLOWED: { label: "🔴 Ikke tillatt", color: "bg-destructive text-destructive-foreground" },
  TRIAL: { label: "🧪 Prøveperiode", color: "bg-accent text-accent-foreground" },
};

const ToolDetail = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const [tool, setTool] = useState<any>(null);
  const [catalogEntry, setCatalogEntry] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!toolId) return;
    Promise.all([
      supabase.from("tools").select("*").eq("id", toolId).single(),
      supabase.from("catalog_entries").select("*").eq("tool_id", toolId).limit(1).maybeSingle(),
      supabase.from("evaluations").select("*").eq("tool_id", toolId).order("decided_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([toolRes, catRes, evalRes]) => {
      setTool(toolRes.data);
      setCatalogEntry(catRes.data);
      setEvaluation(evalRes.data);
      setLoading(false);
    });
  }, [toolId]);

  if (loading) return <p className="text-muted-foreground p-6">Laster...</p>;
  if (!tool) return <p className="text-muted-foreground p-6">Verktøy ikke funnet.</p>;

  const statusCfg = evaluation ? statusConfig[evaluation.decided_status] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/katalog">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Tilbake til Katalog
        </Button>
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
          {tool.category && <Badge variant="secondary">{tool.category}</Badge>}
          {statusCfg && <Badge className={statusCfg.color}>{statusCfg.label}</Badge>}
        </div>
        {tool.vendor && <p className="text-muted-foreground">{tool.vendor}</p>}
      </div>

      {evaluation?.rationale && (
        <Card>
          <CardHeader><CardTitle className="text-base">Vurdering</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{evaluation.rationale}</CardContent>
        </Card>
      )}

      <CatalogEntryEditor
        entry={catalogEntry}
        itemType="tool"
        itemId={toolId!}
        itemName={tool.name}
        itemMeta={{ category: tool.category, provider: tool.vendor }}
        onSaved={(entry) => setCatalogEntry(entry)}
        onDeleted={() => setCatalogEntry(null)}
      />

      {catalogEntry && (
        <div className="space-y-4">
          {catalogEntry.best_for && (
            <Card>
              <CardHeader><CardTitle className="text-base">🎯 Best for</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.best_for}</CardContent>
            </Card>
          )}
          {catalogEntry.example_prompts && (
            <Card>
              <CardHeader><CardTitle className="text-base">💬 Eksempelprompter</CardTitle></CardHeader>
              <CardContent className="prose-catalog text-sm text-muted-foreground">
                <ReactMarkdown>{catalogEntry.example_prompts}</ReactMarkdown>
              </CardContent>
            </Card>
          )}
          {catalogEntry.do_this && (
            <Card>
              <CardHeader><CardTitle className="text-base text-success">✅ Gjør dette</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.do_this}</CardContent>
            </Card>
          )}
          {catalogEntry.avoid_this && (
            <Card>
              <CardHeader><CardTitle className="text-base text-destructive">❌ Unngå dette</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.avoid_this}</CardContent>
            </Card>
          )}
          {catalogEntry.security_guidance && (
            <Card>
              <CardHeader><CardTitle className="text-base">🔒 Sikkerhetsveiledning</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.security_guidance}</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolDetail;
