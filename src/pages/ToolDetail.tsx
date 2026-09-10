import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Target, CircleCheck, CircleX, FlaskConical, StickyNote } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const ToolDetail = () => {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<any>(null);
  const [catalogEntry, setCatalogEntry] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    ALLOWED: { label: t("status.allowed"), icon: CircleCheck, color: "bg-success text-success-foreground" },
    NOT_ALLOWED: { label: t("status.not_allowed"), icon: CircleX, color: "bg-destructive text-destructive-foreground" },
    TRIAL: { label: t("status.trial"), icon: FlaskConical, color: "bg-accent text-accent-foreground" },
  };

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

  if (loading) return <p className="text-muted-foreground p-6">{t("detail.loading")}</p>;
  if (!tool) return <p className="text-muted-foreground p-6">{t("detail.tool_not_found")}</p>;

  const statusCfg = evaluation ? statusConfig[evaluation.decided_status] : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> {t("common.back")}
      </Button>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
          {tool.category && <Badge variant="secondary">{tool.category}</Badge>}
          {tool.usage_scope && (
            <Badge variant="secondary">
              {tool.usage_scope === "INTERNAL" ? t("usage.internal") : tool.usage_scope === "CUSTOMER" ? t("usage.customer") : t("usage.both")}
            </Badge>
          )}
          {statusCfg && (() => {
            const Icon = statusCfg.icon;
            return <Badge className={statusCfg.color}><Icon className="h-3.5 w-3.5 mr-1" />{statusCfg.label}</Badge>;
          })()}
        </div>
        {tool.vendor && <p className="text-muted-foreground">{tool.vendor}</p>}
      </div>

      <div className="space-y-4">
        {catalogEntry?.best_for && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><Target className="h-4 w-4" /> {t("detail.best_for")}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{catalogEntry.best_for}</CardContent>
          </Card>
        )}
        {tool.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-1.5"><StickyNote className="h-4 w-4" /> {t("detail.notes")}</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{tool.notes}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ToolDetail;
