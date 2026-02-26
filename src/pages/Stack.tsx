import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CircleCheck, CircleX, FlaskConical, Wrench, Brain, ChevronRight } from "lucide-react";

const statusConfig = {
  ALLOWED: { label: "Tillatt", icon: CircleCheck, color: "bg-success text-success-foreground" },
  NOT_ALLOWED: { label: "Ikke tillatt", icon: CircleX, color: "bg-destructive text-destructive-foreground" },
  TRIAL: { label: "Prøveperiode", icon: FlaskConical, color: "bg-accent text-accent-foreground" },
};

const groups = ["ALLOWED", "NOT_ALLOWED", "TRIAL"] as const;

interface StackSectionProps {
  evaluations: any[];
  getName: (id: string) => string;
  getExtra?: (id: string) => string | null;
  onClickItem?: (id: string) => void;
}

const StackSection = ({ evaluations, getName, getExtra, onClickItem }: StackSectionProps) => {
  const hasItems = evaluations.length > 0;

  if (!hasItems) {
    return <p className="text-muted-foreground text-center py-12">Ingen elementer er evaluert ennå.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((status) => {
        const items = evaluations.filter((e) => e.decided_status === status);
        const cfg = statusConfig[status];
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
                      {ev.rationale && <p className="text-sm text-muted-foreground">{ev.rationale}</p>}
                      {ev.version && <span className="text-xs text-muted-foreground">{ev.version}</span>}
                      {onClickItem && (
                        <p className="text-xs text-primary font-medium pt-1">Se detaljer og veiledning →</p>
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

  if (loading) return <p className="text-muted-foreground">Laster...</p>;

  const toolEvals = evaluations.filter((e) => e.tool_id);
  const modelEvals = evaluations.filter((e) => e.model_id && !e.tool_id);

  const getToolName = (id: string) => tools.find((t) => t.id === id)?.name || "Ukjent";
  const getModelName = (id: string) => models.find((m) => m.id === id)?.name || "Ukjent";
  const getModelProvider = (id: string) => models.find((m) => m.id === id)?.provider || null;
  const getToolExtra = (id: string) => {
    const tool = tools.find((t) => t.id === id);
    const cat = catalogEntries.find((c) => c.tool_id === id);
    const parts: string[] = [];
    if (tool?.vendor) parts.push(tool.vendor);
    if (tool?.category) parts.push(tool.category);
    if (cat?.best_for) parts.push(cat.best_for);
    return parts.length > 0 ? parts.join(" · ") : null;
  };
  const getModelExtra = (id: string) => {
    const model = models.find((m) => m.id === id);
    const cat = catalogEntries.find((c) => c.model_id === id);
    const parts: string[] = [];
    if (model?.provider) parts.push(model.provider);
    if (model?.modality) parts.push(model.modality);
    if (cat?.best_for) parts.push(cat.best_for);
    return parts.length > 0 ? parts.join(" · ") : null;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Anbefalt Stack</h1>
        <p className="text-muted-foreground">Organisasjonens anbefalte AI-verktøy og modeller</p>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools" className="flex items-center gap-1.5">
            <Wrench className="h-4 w-4" /> Verktøy ({toolEvals.length})
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-1.5">
            <Brain className="h-4 w-4" /> Modeller ({modelEvals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          <StackSection
            evaluations={toolEvals}
            getName={getToolName}
            getExtra={getToolExtra}
            onClickItem={(id) => navigate(`/katalog/${id}`)}
          />
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <StackSection
            evaluations={modelEvals}
            getName={getModelName}
            getExtra={getModelExtra}
            onClickItem={(id) => navigate(`/katalog/modell/${id}`)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stack;
