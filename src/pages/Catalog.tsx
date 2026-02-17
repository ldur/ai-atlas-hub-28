import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string }> = {
  STANDARD: { label: "🟢 Standard", color: "bg-success text-success-foreground" },
  ALLOWED: { label: "🟡 Tillatt", color: "bg-warning text-warning-foreground" },
  NOT_ALLOWED: { label: "🔴 Ikke tillatt", color: "bg-destructive text-destructive-foreground" },
  TRIAL: { label: "🧪 Prøveperiode", color: "bg-accent text-accent-foreground" },
};

const Catalog = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      supabase.from("tools").select("*"),
      supabase.from("models").select("*"),
      supabase.from("evaluations").select("*"),
    ]).then(([toolRes, modelRes, evalRes]) => {
      setTools(toolRes.data || []);
      setModels(modelRes.data || []);
      setEvaluations(evalRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">Laster katalog...</p>;

  const getToolEval = (id: string) => evaluations.find((e) => e.tool_id === id);
  const getModelEval = (id: string) => evaluations.find((e) => e.model_id === id && !e.tool_id);

  const statuses = [
    { value: "STANDARD", label: "🟢 Standard" },
    { value: "ALLOWED", label: "🟡 Tillatt" },
    { value: "NOT_ALLOWED", label: "🔴 Ikke tillatt" },
    { value: "TRIAL", label: "🧪 Prøveperiode" },
  ];

  const handleStatusChange = async (
    newStatus: string,
    itemType: "tool" | "model",
    itemId: string
  ) => {
    const existing = itemType === "tool" ? getToolEval(itemId) : getModelEval(itemId);
    try {
      if (existing?.id) {
        const { data, error } = await supabase
          .from("evaluations")
          .update({ decided_status: newStatus, decided_at: new Date().toISOString() })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        setEvaluations((prev) => prev.map((e) => (e.id === existing.id ? data : e)));
      } else {
        const payload = {
          decided_status: newStatus,
          decided_at: new Date().toISOString(),
          ...(itemType === "tool" ? { tool_id: itemId } : { model_id: itemId }),
        };
        const { data, error } = await supabase.from("evaluations").insert(payload).select().single();
        if (error) throw error;
        setEvaluations((prev) => [...prev, data]);
      }
      toast.success("Status oppdatert");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke oppdatere status");
    }
  };

  const matchesStatusFilter = (itemId: string, type: "tool" | "model") => {
    if (statusFilter === "ALL") return true;
    const ev = type === "tool" ? getToolEval(itemId) : getModelEval(itemId);
    if (statusFilter === "NONE") return !ev;
    return ev?.decided_status === statusFilter;
  };

  const filteredTools = tools.filter(
    (t) =>
      (t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.vendor || "").toLowerCase().includes(search.toLowerCase())) &&
      matchesStatusFilter(t.id, "tool")
  );

  const filteredModels = models.filter(
    (m) =>
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.provider || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.modality || "").toLowerCase().includes(search.toLowerCase())) &&
      matchesStatusFilter(m.id, "model")
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Verktøykatalog</h1>
        <p className="text-muted-foreground">Komplett oversikt over alle AI-verktøy og modeller</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i katalogen..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer status" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="ALL">Alle statuser</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
            <SelectItem value="NONE">Ikke klassifisert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools">🛠️ Verktøy ({filteredTools.length})</TabsTrigger>
          <TabsTrigger value="models">🧠 Modeller ({filteredModels.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          {filteredTools.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Ingen verktøy funnet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredTools.map((tool) => {
                const ev = getToolEval(tool.id);
                const cfg = ev ? statusConfig[ev.decided_status] : null;
                return (
                  <Card
                    key={tool.id}
                    className="hover:border-primary transition-colors"
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/katalog/${tool.id}`)}>
                          {tool.name}
                        </span>
                        <Select
                          value={cfg ? ev.decided_status : ""}
                          onValueChange={(val) => handleStatusChange(val, "tool", tool.id)}
                        >
                          <SelectTrigger className="w-auto h-7 text-xs px-2 gap-1" onClick={(e) => e.stopPropagation()}>
                            <SelectValue placeholder="Sett status">
                              {cfg ? cfg.label : "Sett status"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {tool.category && <span>{tool.category}</span>}
                        {tool.vendor && <span>· {tool.vendor}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          {filteredModels.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Ingen modeller funnet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredModels.map((model) => {
                const ev = getModelEval(model.id);
                const cfg = ev ? statusConfig[ev.decided_status] : null;
                return (
                  <Card
                    key={model.id}
                    className="hover:border-primary transition-colors"
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/katalog/modell/${model.id}`)}>
                          {model.name}
                        </span>
                        <Select
                          value={cfg ? ev.decided_status : ""}
                          onValueChange={(val) => handleStatusChange(val, "model", model.id)}
                        >
                          <SelectTrigger className="w-auto h-7 text-xs px-2 gap-1" onClick={(e) => e.stopPropagation()}>
                            <SelectValue placeholder="Sett status">
                              {cfg ? cfg.label : "Sett status"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {model.provider && <span>{model.provider}</span>}
                        {model.modality && <span>· {model.modality}</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Catalog;
