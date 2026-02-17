import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const statusConfig = {
  STANDARD: { label: "🟢 Standard", color: "bg-success text-success-foreground" },
  ALLOWED: { label: "🟡 Tillatt ved behov", color: "bg-warning text-warning-foreground" },
  NOT_ALLOWED: { label: "🔴 Ikke tillatt", color: "bg-destructive text-destructive-foreground" },
  TRIAL: { label: "🧪 Prøveperiode", color: "bg-accent text-accent-foreground" },
};

const Stack = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      supabase.from("evaluations").select("*"),
      supabase.from("tools").select("*"),
    ]).then(([evalRes, toolRes]) => {
      setEvaluations(evalRes.data || []);
      setTools(toolRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">Laster...</p>;

  const getToolName = (toolId: string) => tools.find((t) => t.id === toolId)?.name || "Ukjent";

  const groups = ["STANDARD", "ALLOWED", "NOT_ALLOWED", "TRIAL"] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Anbefalt Verktøystack</h1>
        <p className="text-muted-foreground">Organisasjonens anbefalte AI-verktøy</p>
      </div>

      {groups.map((status) => {
        const items = evaluations.filter((e) => e.decided_status === status && e.tool_id);
        const cfg = statusConfig[status];
        if (items.length === 0) return null;
        return (
          <div key={status} className="space-y-3">
            <h2 className="text-lg font-semibold">{cfg.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((ev) => (
                <Card key={ev.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate(`/katalog/${ev.tool_id}`)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getToolName(ev.tool_id)}</span>
                      <Badge className={cfg.color}>{status}</Badge>
                    </div>
                    {ev.rationale && <p className="text-sm text-muted-foreground">{ev.rationale}</p>}
                    {ev.version && <span className="text-xs text-muted-foreground">{ev.version}</span>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {evaluations.filter((e) => e.tool_id).length === 0 && (
        <p className="text-muted-foreground text-center py-12">Ingen verktøy er evaluert ennå. Admin kan legge til verktøy.</p>
      )}
    </div>
  );
};

export default Stack;
