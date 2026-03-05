import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CircleCheck, CircleX, FlaskConical, Wrench, Brain, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const groups = ["ALLOWED", "NOT_ALLOWED", "TRIAL"] as const;

interface StackSectionProps {
  evaluations: any[];
  getName: (id: string) => string;
  getExtra?: (id: string) => string | null;
  getLink?: (id: string) => string | null;
  getLinkLabel?: (id: string) => string | null;
  onClickItem?: (id: string) => void;
  statusLabels: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }>;
  seeDetailsText: string;
  noItemsText: string;
}

const StackSection = ({ evaluations, getName, getExtra, getLink, getLinkLabel, onClickItem, statusLabels, seeDetailsText, noItemsText }: StackSectionProps) => {
  if (evaluations.length === 0) {
    return <p className="text-muted-foreground text-center py-12">{noItemsText}</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((status) => {
        const items = evaluations.filter((e) => e.decided_status === status);
        const cfg = statusLabels[status];
        const StatusIcon = cfg.icon;
        if (items.length === 0) return null;
        return (
          <div key={status} className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <StatusIcon className="h-5 w-5" /> {cfg.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((ev) => {
                const itemId = ev.tool_id || ev.model_id;
                return (
                  <Card
                    key={ev.id}
                    className={`${onClickItem ? "cursor-pointer hover:border-primary group" : ""} transition-colors`}
                    onClick={() => onClickItem?.(itemId)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getName(itemId)}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                          {onClickItem && <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                        </div>
                      </div>
                      {getExtra && getExtra(itemId) && (
                        <p className="text-xs text-muted-foreground">{getExtra(itemId)}</p>
                      )}
                      {getLink && getLink(itemId) && (
                        <a
                          href={getLink(itemId)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
                        >
                          {getLinkLabel?.(itemId) || getLink(itemId)}
                        </a>
                      )}
                      {ev.rationale && <p className="text-sm text-muted-foreground">{ev.rationale}</p>}
                      {ev.version && <span className="text-xs text-muted-foreground">{ev.version}</span>}
                      {onClickItem && (
                        <p className="text-xs text-primary font-medium pt-1">{seeDetailsText}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Stack = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    Promise.all([
      supabase.from("evaluations").select("*"),
      supabase.from("tools").select("*"),
      supabase.from("models").select("*"),
      supabase.from("catalog_entries").select("*"),
    ]).then(([evalRes, toolRes, modelRes, catRes]) => {
      setEvaluations(evalRes.data || []);
      setTools(toolRes.data || []);
      setModels(modelRes.data || []);
      setCatalogEntries(catRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  const statusLabels = {
    ALLOWED: { label: t("status.allowed"), icon: CircleCheck, color: "bg-success text-success-foreground" },
    NOT_ALLOWED: { label: t("status.not_allowed"), icon: CircleX, color: "bg-destructive text-destructive-foreground" },
    TRIAL: { label: t("status.trial"), icon: FlaskConical, color: "bg-accent text-accent-foreground" },
  };

  const toolEvals = evaluations.filter((e) => e.tool_id);
  const modelEvals = evaluations.filter((e) => e.model_id && !e.tool_id);

  const getToolName = (id: string) => tools.find((t) => t.id === id)?.name || t("common.unknown");
  const getModelName = (id: string) => models.find((m) => m.id === id)?.name || t("common.unknown");
  const getModelProvider = (id: string) => models.find((m) => m.id === id)?.provider || null;
  const getToolLink = (id: string) => tools.find((t) => t.id === id)?.link || null;
  const getToolVendor = (id: string) => tools.find((t) => t.id === id)?.vendor || null;
  const getModelLink = (id: string) => models.find((m) => m.id === id)?.link || null;
  const getToolExtra = (id: string) => {
    const tool = tools.find((t) => t.id === id);
    const cat = catalogEntries.find((c) => c.tool_id === id);
    const parts: string[] = [];
    if (tool?.category) parts.push(tool.category);
    if (cat?.best_for) parts.push(cat.best_for);
    return parts.length > 0 ? parts.join(" · ") : null;
  };
  const getModelExtra = (id: string) => {
    const model = models.find((m) => m.id === id);
    const cat = catalogEntries.find((c) => c.model_id === id);
    const parts: string[] = [];
    if (model?.modality) parts.push(model.modality);
    if (cat?.best_for) parts.push(cat.best_for);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("stack.title")}</h1>
        <p className="text-muted-foreground">{t("stack.subtitle")}</p>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools" className="flex items-center gap-1.5">
            <Wrench className="h-4 w-4" /> {t("common.tools")} ({toolEvals.length})
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-1.5">
            <Brain className="h-4 w-4" /> {t("common.models")} ({modelEvals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          <StackSection
            evaluations={toolEvals}
            getName={getToolName}
            getExtra={getToolExtra}
            getLink={getToolLink}
            getLinkLabel={getToolVendor}
            onClickItem={(id) => navigate(`/katalog/${id}`)}
            statusLabels={statusLabels}
            seeDetailsText={t("stack.see_details")}
            noItemsText={t("stack.no_items")}
          />
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <StackSection
            evaluations={modelEvals}
            getName={getModelName}
            getExtra={getModelExtra}
            getLink={getModelLink}
            getLinkLabel={getModelProvider}
            onClickItem={(id) => navigate(`/katalog/modell/${id}`)}
            statusLabels={statusLabels}
            seeDetailsText={t("stack.see_details")}
            noItemsText={t("stack.no_items")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stack;
