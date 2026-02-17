import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const statusConfig = {
  STANDARD: { label: "🟢 Standard", color: "bg-success text-success-foreground" },
  ALLOWED: { label: "🟡 Tillatt ved behov", color: "bg-warning text-warning-foreground" },
  NOT_ALLOWED: { label: "🔴 Ikke tillatt", color: "bg-destructive text-destructive-foreground" },
  TRIAL: { label: "🧪 Prøveperiode", color: "bg-accent text-accent-foreground" },
};

const groups = ["STANDARD", "ALLOWED", "NOT_ALLOWED", "TRIAL"] as const;

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
        if (items.length === 0) return null;
        return (
          <div key={status} className="space-y-3">
            <h2 className="text-lg font-semibold">{cfg.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((ev) => {
                const itemId = ev.tool_id || ev.model_id;
                return (
                  <Card
                    key={ev.id}
                    className={`${onClickItem ? "cursor-pointer hover:border-primary" : ""} transition-colors`}
                    onClick={() => onClickItem?.(itemId)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{getName(itemId)}</span>
                        <Badge className={cfg.color}>{status}</Badge>
                      </div>
                      {getExtra && getExtra(itemId) && (
                        <p className="text-xs text-muted-foreground">{getExtra(itemId)}</p>
                      )}
                      {ev.rationale && <p className="text-sm text-muted-foreground">{ev.rationale}</p>}
                      {ev.version && <span className="text-xs text-muted-foreground">{ev.version}</span>}
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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      supabase.from("evaluations").select("*"),
      supabase.from("tools").select("*"),
      supabase.from("models").select("*"),
    ]).then(([evalRes, toolRes, modelRes]) => {
      setEvaluations(evalRes.data || []);
      setTools(toolRes.data || []);
      setModels(modelRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">Laster...</p>;

  const toolEvals = evaluations.filter((e) => e.tool_id);
  const modelEvals = evaluations.filter((e) => e.model_id && !e.tool_id);

  const getToolName = (id: string) => tools.find((t) => t.id === id)?.name || "Ukjent";
  const getModelName = (id: string) => models.find((m) => m.id === id)?.name || "Ukjent";
  const getModelProvider = (id: string) => models.find((m) => m.id === id)?.provider || null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Anbefalt Stack</h1>
        <p className="text-muted-foreground">Organisasjonens anbefalte AI-verktøy og modeller</p>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools">🛠️ Verktøy ({toolEvals.length})</TabsTrigger>
          <TabsTrigger value="models">🧠 Modeller ({modelEvals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          <StackSection
            evaluations={toolEvals}
            getName={getToolName}
            onClickItem={(id) => navigate(`/katalog/${id}`)}
          />
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <StackSection
            evaluations={modelEvals}
            getName={getModelName}
            getExtra={getModelProvider}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Stack;
