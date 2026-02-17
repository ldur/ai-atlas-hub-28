import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { CatalogEntryEditor } from "@/components/CatalogEntryEditor";
import { StatusEditor } from "@/components/StatusEditor";

const statusConfig: Record<string, { label: string; color: string }> = {
  STANDARD: { label: "🟢 Standard", color: "bg-success text-success-foreground" },
  ALLOWED: { label: "🟡 Tillatt ved behov", color: "bg-warning text-warning-foreground" },
  NOT_ALLOWED: { label: "🔴 Ikke tillatt", color: "bg-destructive text-destructive-foreground" },
  TRIAL: { label: "🧪 Prøveperiode", color: "bg-accent text-accent-foreground" },
};

const ModelDetail = () => {
  const { modelId } = useParams<{ modelId: string }>();
  const [model, setModel] = useState<any>(null);
  const [catalogEntry, setCatalogEntry] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!modelId) return;
    Promise.all([
      supabase.from("models").select("*").eq("id", modelId).single(),
      supabase.from("catalog_entries").select("*").eq("model_id", modelId).limit(1).maybeSingle(),
      supabase.from("evaluations").select("*").eq("model_id", modelId).order("decided_at", { ascending: false }).limit(1).maybeSingle(),
    ]).then(([modelRes, catRes, evalRes]) => {
      setModel(modelRes.data);
      setCatalogEntry(catRes.data);
      setEvaluation(evalRes.data);
      setLoading(false);
    });
  }, [modelId]);

  if (loading) return <p className="text-muted-foreground p-6">Laster...</p>;
  if (!model) return <p className="text-muted-foreground p-6">Modell ikke funnet.</p>;

  const statusCfg = evaluation ? statusConfig[evaluation.decided_status] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/katalog">
        <Button variant="ghost" size="sm" className="gap-1">
          ← Tilbake til Katalog
        </Button>
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{model.name}</h1>
          {statusCfg && <Badge className={statusCfg.color}>{statusCfg.label}</Badge>}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {model.provider && <span>{model.provider}</span>}
          {model.modality && <span>· {model.modality}</span>}
        </div>
      </div>

      {model.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notater</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">{model.notes}</CardContent>
        </Card>
      )}

      <StatusEditor
        evaluation={evaluation}
        itemType="model"
        itemId={modelId!}
        onSaved={(ev) => setEvaluation(ev)}
      />

      <CatalogEntryEditor
        entry={catalogEntry}
        itemType="model"
        itemId={modelId!}
        itemName={model.name}
        itemMeta={{ provider: model.provider, modality: model.modality }}
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

export default ModelDetail;
