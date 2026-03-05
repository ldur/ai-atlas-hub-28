import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { adminAction, isAdmin } from "@/lib/adminAction";
import { toast } from "sonner";
import { CircleCheck, CircleX, FlaskConical, Search, Wrench, Brain, Plus, Pencil, Trash2 } from "lucide-react";
import { ToolFormDialog } from "@/components/catalog/ToolFormDialog";
import { ModelFormDialog } from "@/components/catalog/ModelFormDialog";
import { DeleteConfirmDialog } from "@/components/catalog/DeleteConfirmDialog";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    ALLOWED: { label: t("status.allowed"), icon: CircleCheck, color: "bg-success text-success-foreground" },
    NOT_ALLOWED: { label: t("status.not_allowed"), icon: CircleX, color: "bg-destructive text-destructive-foreground" },
    TRIAL: { label: t("status.trial"), icon: FlaskConical, color: "bg-accent text-accent-foreground" },
  };

  const statuses = [
    { value: "ALLOWED", label: t("status.allowed"), icon: CircleCheck },
    { value: "NOT_ALLOWED", label: t("status.not_allowed"), icon: CircleX },
    { value: "TRIAL", label: t("status.trial"), icon: FlaskConical },
  ];

  // CRUD dialog state
  const [toolDialogOpen, setToolDialogOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<any | null>(null);
  const [editingModel, setEditingModel] = useState<any | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; name: string; id: string; table: "tools" | "models" }>({ open: false, name: "", id: "", table: "tools" });

  const fetchData = useCallback(() => {
    setLoading(true);
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

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  const getToolEval = (id: string) => evaluations.find((e) => e.tool_id === id);
  const getModelEval = (id: string) => evaluations.find((e) => e.model_id === id && !e.tool_id);
  const getCatalogEntry = (itemId: string, type: "tool" | "model") =>
    catalogEntries.find((c) => (type === "tool" ? c.tool_id === itemId : c.model_id === itemId));

  const handleStatusChange = async (newStatus: string, itemType: "tool" | "model", itemId: string) => {
    if (!admin) { toast.error(t("status.only_admin")); return; }
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
      toast.success(t("status.updated"));
    } catch (e: any) {
      toast.error(e.message || t("common.error"));
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

  const renderStatusLabel = (cfg: typeof statusConfig[string]) => {
    const Icon = cfg.icon;
    return <span className="flex items-center gap-1"><Icon className="h-3.5 w-3.5" /> {cfg.label}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("catalog.title")}</h1>
        <p className="text-muted-foreground">{t("catalog.subtitle")}</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("catalog.search")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer status" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="ALL">{t("status.all_statuses")}</SelectItem>
            {statuses.map((s) => {
              const Icon = s.icon;
              return (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {s.label}</span>
                </SelectItem>
              );
            })}
            <SelectItem value="NONE">{t("status.not_classified")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools" className="flex items-center gap-1.5">
            <Wrench className="h-4 w-4" /> {t("common.tools")} ({filteredTools.length})
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center gap-1.5">
            <Brain className="h-4 w-4" /> {t("common.models")} ({filteredModels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          {admin && (
            <div className="mb-4">
              <Button size="sm" className="gap-1.5" onClick={() => { setEditingTool(null); setToolDialogOpen(true); }}>
                <Plus className="h-4 w-4" /> {t("catalog.add_tool")}
              </Button>
            </div>
          )}
          {filteredTools.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">{t("catalog.no_tools")}</p>
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
                        <div className="flex items-center gap-1">
                          {admin ? (
                            <>
                              <Select
                                value={cfg ? ev.decided_status : ""}
                                onValueChange={(val) => handleStatusChange(val, "tool", tool.id)}
                              >
                                <SelectTrigger className="w-auto h-7 text-xs px-2 gap-1" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue placeholder="Sett status">
                                    {cfg ? renderStatusLabel(cfg) : "Sett status"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {statuses.map((s) => {
                                    const Icon = s.icon;
                                    return (
                                      <SelectItem key={s.value} value={s.value}>
                                        <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {s.label}</span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingTool(tool); setToolDialogOpen(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, name: tool.name, id: tool.id, table: "tools" }); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : cfg ? (
                            <Badge className={cfg.color}>{renderStatusLabel(cfg)}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {tool.category && <span>{tool.category}</span>}
                      </div>
                      {tool.link && (
                        <a
                          href={tool.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
                        >
                          {tool.vendor || tool.link}
                        </a>
                      )}
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
          {admin && (
            <div className="mb-4">
              <Button size="sm" className="gap-1.5" onClick={() => { setEditingModel(null); setModelDialogOpen(true); }}>
                <Plus className="h-4 w-4" /> {t("catalog.add_model")}
              </Button>
            </div>
          )}
          {filteredModels.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">{t("catalog.no_models")}</p>
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
                        <div className="flex items-center gap-1">
                          {admin ? (
                            <>
                              <Select
                                value={cfg ? ev.decided_status : ""}
                                onValueChange={(val) => handleStatusChange(val, "model", model.id)}
                              >
                                <SelectTrigger className="w-auto h-7 text-xs px-2 gap-1" onClick={(e) => e.stopPropagation()}>
                                  <SelectValue placeholder="Sett status">
                                    {cfg ? renderStatusLabel(cfg) : "Sett status"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {statuses.map((s) => {
                                    const Icon = s.icon;
                                    return (
                                      <SelectItem key={s.value} value={s.value}>
                                        <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {s.label}</span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setEditingModel(model); setModelDialogOpen(true); }}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, name: model.name, id: model.id, table: "models" }); }}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : cfg ? (
                            <Badge className={cfg.color}>{renderStatusLabel(cfg)}</Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {model.modality && <span>{model.modality}</span>}
                      </div>
                      {model.link && (
                        <a
                          href={model.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
                        >
                          {model.provider || model.link}
                        </a>
                      )}
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

      {/* CRUD Dialogs */}
      <ToolFormDialog open={toolDialogOpen} onOpenChange={setToolDialogOpen} tool={editingTool} onSaved={fetchData} initialCatalogEntry={editingTool ? getCatalogEntry(editingTool.id, "tool") || null : null} />
      <ModelFormDialog open={modelDialogOpen} onOpenChange={setModelDialogOpen} model={editingModel} onSaved={fetchData} initialCatalogEntry={editingModel ? getCatalogEntry(editingModel.id, "model") || null : null} />
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        itemName={deleteDialog.name}
        itemId={deleteDialog.id}
        table={deleteDialog.table}
        onDeleted={fetchData}
      />
    </div>
  );
};

export default Catalog;
