import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { StatusEditor } from "@/components/StatusEditor";
import { ArrowLeft, Target, MessageSquare, CheckCircle2, XCircle, Shield, CircleCheck, CircleX, FlaskConical } from "lucide-react";

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  ALLOWED: { label: "Tillatt", icon: CircleCheck, color: "bg-success text-success-foreground" },
  NOT_ALLOWED: { label: "Ikke tillatt", icon: CircleX, color: "bg-destructive text-destructive-foreground" },
  TRIAL: { label: "Prøveperiode", icon: FlaskConical, color: "bg-accent text-accent-foreground" },
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
          {statusCfg && (() => {
            const Icon = statusCfg.icon;
            return <Badge className={statusCfg.color}><Icon className="h-3.5 w-3.5 mr-1" />{statusCfg.label}</Badge>;
          })()}
        </div>
        {tool.vendor && <p className="text-muted-foreground">{tool.vendor}</p>}
      </div>

      <StatusEditor evaluation={evaluation} itemType="tool" itemId={toolId!} onSaved={(ev) => setEvaluation(ev)} />

      {catalogEntry && (
        <div className="space-y-4">
          {catalogEntry.best_for && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><Target className="h-4 w-4" /> Best for</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.best_for}</CardContent>
            </Card>
          )}
          {catalogEntry.example_prompts && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><MessageSquare className="h-4 w-4" /> Eksempelprompter</CardTitle></CardHeader>
              <CardContent className="prose-catalog text-sm text-muted-foreground">
                <ReactMarkdown>{catalogEntry.example_prompts}</ReactMarkdown>
              </CardContent>
            </Card>
          )}
          {catalogEntry.do_this && (
            <Card>
              <CardHeader><CardTitle className="text-base text-success flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Gjør dette</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.do_this}</CardContent>
            </Card>
          )}
          {catalogEntry.avoid_this && (
            <Card>
              <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-1.5"><XCircle className="h-4 w-4" /> Unngå dette</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.avoid_this}</CardContent>
            </Card>
          )}
          {catalogEntry.security_guidance && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><Shield className="h-4 w-4" /> Sikkerhetsveiledning</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">{catalogEntry.security_guidance}</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolDetail;
