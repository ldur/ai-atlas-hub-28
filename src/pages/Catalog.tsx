import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { adminAction, isAdmin } from "@/lib/adminAction";
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
  const [catalogEntries, setCatalogEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const admin = isAdmin();

  useEffect(() => {
    Promise.all([
      supabase.from("tools").select("*"),
      supabase.from("models").select("*"),
      supabase.from("evaluations").select("*"),
      supabase.from("catalog_entries").select("*"),
    ]).then(([toolRes, modelRes, evalRes, catRes]) => {
      setTools(toolRes.data || []);
      setModels(modelRes.data || []);
      setEvaluations(evalRes.data || []);
      setCatalogEntries(catRes.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-muted-foreground">Laster katalog...</p>;

  const getToolEval = (id: string) => evaluations.find((e) => e.tool_id === id);
  const getModelEval = (id: string) => evaluations.find((e) => e.model_id === id && !e.tool_id);
  const getCatalogEntry = (itemId: string, type: "tool" | "model") =>
    catalogEntries.find((c) => (type === "tool" ? c.tool_id === itemId : c.model_id === itemId));

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
    if (!admin) { toast.error("Kun admin kan endre status"); return; }
    const existing = itemType === "tool" ? getToolEval(itemId) : getModelEval(itemId);
    try {
      const payload = {
        decided_status: newStatus,
        decided_at: new Date().toISOString(),
        ...(itemType === "tool" ? { tool_id: itemId } : { model_id: itemId }),
      };
      if (existing?.id) {
        const data = await adminAction({ action: "update", table: "evaluations", id: existing.id, payload });
        setEvaluations((prev) => prev.map((e) => (e.id === existing.id ? data : e)));
      } else {
        const data = await adminAction({ action: "insert", table: "evaluations", payload });
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</span>
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
                  <Card key={tool.id} className="hover:border-primary transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/katalog/${tool.id}`)}>
                          {tool.name}
                        </span>
                        {admin ? (
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
                        ) : cfg ? (
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {tool.category && <span>{tool.category}</span>}
                        {tool.vendor && <span>· {tool.vendor}</span>}
                      </div>
                      {getCatalogEntry(tool.id, "tool")?.best_for && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{getCatalogEntry(tool.id, "tool").best_for}</p>
                      )}
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
                  <Card key={model.id} className="hover:border-primary transition-colors">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium cursor-pointer hover:underline" onClick={() => navigate(`/katalog/modell/${model.id}`)}>
                          {model.name}
                        </span>
                        {admin ? (
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
                        ) : cfg ? (
                          <Badge className={cfg.color}>{cfg.label}</Badge>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {model.provider && <span>{model.provider}</span>}
                        {model.modality && <span>· {model.modality}</span>}
                      </div>
                      {getCatalogEntry(model.id, "model")?.best_for && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{getCatalogEntry(model.id, "model").best_for}</p>
                      )}
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
