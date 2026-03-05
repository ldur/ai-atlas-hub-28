import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { adminAction } from "@/lib/adminAction";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import {
  Wrench, Brain, CircleCheck, CircleX, FlaskConical, AlertTriangle,
  Pencil, Trash2, Plus, History, Users, TrendingUp, CheckCircle2,
  ArrowRight, Loader2, Search, Filter, BarChart3
} from "lucide-react";

interface EvalDashboardProps {
  tools: any[];
  models: any[];
  evaluations: any[];
  catalogEntries: any[];
  submissions: any[];
  onRefresh: () => void;
}

interface UnifiedItem {
  id: string;
  name: string;
  type: "tool" | "model";
  category?: string;
  vendor?: string;
  provider?: string;
  evaluation?: any;
  catalogEntry?: any;
  submissionCount: number;
  mustKeepCount: number;
  useCases: string[];
}

const statusConfig = {
  ALLOWED: { icon: CircleCheck, label: "status.allowed" as const, badgeClass: "bg-primary/10 text-primary border-primary/20" },
  NOT_ALLOWED: { icon: CircleX, label: "status.not_allowed" as const, badgeClass: "bg-destructive/10 text-destructive border-destructive/20" },
  TRIAL: { icon: FlaskConical, label: "status.trial" as const, badgeClass: "bg-accent text-accent-foreground border-accent" },
};

export function EvaluationDashboard({ tools, models, evaluations, catalogEntries, submissions, onRefresh }: EvalDashboardProps) {
  const { t } = useI18n();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "tool" | "model">("all");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ALLOWED" | "NOT_ALLOWED" | "TRIAL" | "UNCLASSIFIED">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "popularity" | "status">("popularity");
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);

  // Evaluation form state
  const [evalFormOpen, setEvalFormOpen] = useState(false);
  const [evalItem, setEvalItem] = useState<UnifiedItem | null>(null);
  const [evalStatus, setEvalStatus] = useState("ALLOWED");
  const [evalRationale, setEvalRationale] = useState("");
  const [evalVersion, setEvalVersion] = useState("v1");
  const [evalValue, setEvalValue] = useState("");
  const [evalRisk, setEvalRisk] = useState("");
  const [evalCost, setEvalCost] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Build unified list
  const unifiedItems = useMemo(() => {
    const items: UnifiedItem[] = [];

    const toolSubmissionCounts: Record<string, number> = {};
    const modelSubmissionCounts: Record<string, number> = {};
    const mustKeepCounts: Record<string, number> = {};
    const itemUseCases: Record<string, Set<string>> = {};

    for (const s of submissions) {
      for (const toolName of s.tools_used || []) {
        toolSubmissionCounts[toolName] = (toolSubmissionCounts[toolName] || 0) + 1;
        if (!itemUseCases[toolName]) itemUseCases[toolName] = new Set();
        for (const uc of s.use_cases || []) itemUseCases[toolName].add(uc);
      }
      for (const modelName of s.models_used || []) {
        modelSubmissionCounts[modelName] = (modelSubmissionCounts[modelName] || 0) + 1;
        if (!itemUseCases[modelName]) itemUseCases[modelName] = new Set();
        for (const uc of s.use_cases || []) itemUseCases[modelName].add(uc);
      }
      if (s.must_keep_tool) {
        const mk = s.must_keep_tool.trim();
        mustKeepCounts[mk] = (mustKeepCounts[mk] || 0) + 1;
      }
    }

    for (const tool of tools) {
      items.push({
        id: tool.id,
        name: tool.name,
        type: "tool",
        category: tool.category,
        vendor: tool.vendor,
        evaluation: evaluations.find(e => e.tool_id === tool.id),
        catalogEntry: catalogEntries.find(c => c.tool_id === tool.id),
        submissionCount: toolSubmissionCounts[tool.name] || 0,
        mustKeepCount: mustKeepCounts[tool.name] || 0,
        useCases: Array.from(itemUseCases[tool.name] || []),
      });
    }

    for (const model of models) {
      items.push({
        id: model.id,
        name: model.name,
        type: "model",
        provider: model.provider,
        evaluation: evaluations.find(e => e.model_id === model.id),
        catalogEntry: catalogEntries.find(c => c.model_id === model.id),
        submissionCount: modelSubmissionCounts[model.name] || 0,
        mustKeepCount: mustKeepCounts[model.name] || 0,
        useCases: Array.from(itemUseCases[model.name] || []),
      });
    }

    return items;
  }, [tools, models, evaluations, catalogEntries, submissions]);

  // Filter and sort
  const filtered = useMemo(() => {
    let result = unifiedItems.filter(item => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (filterStatus === "UNCLASSIFIED" && item.evaluation) return false;
      if (filterStatus !== "ALL" && filterStatus !== "UNCLASSIFIED" && item.evaluation?.decided_status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!item.name.toLowerCase().includes(q) && !(item.vendor || item.provider || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "popularity") return b.submissionCount - a.submissionCount;
      if (sortBy === "status") {
        const aStatus = a.evaluation ? 1 : 0;
        const bStatus = b.evaluation ? 1 : 0;
        if (aStatus !== bStatus) return aStatus - bStatus; // unclassified first
        return a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [unifiedItems, filterType, filterStatus, search, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = unifiedItems.length;
    const evaluated = unifiedItems.filter(i => i.evaluation).length;
    const allowed = unifiedItems.filter(i => i.evaluation?.decided_status === "ALLOWED").length;
    const notAllowed = unifiedItems.filter(i => i.evaluation?.decided_status === "NOT_ALLOWED").length;
    const trial = unifiedItems.filter(i => i.evaluation?.decided_status === "TRIAL").length;
    const withCatalog = unifiedItems.filter(i => i.catalogEntry).length;
    return { total, evaluated, unevaluated: total - evaluated, allowed, notAllowed, trial, withCatalog };
  }, [unifiedItems]);

  const openEvalForm = (item: UnifiedItem, existing?: any) => {
    setEvalItem(item);
    if (existing) {
      setEditingId(existing.id);
      setEvalStatus(existing.decided_status);
      setEvalRationale(existing.rationale || "");
      setEvalVersion(existing.version || "v1");
      setEvalValue(existing.value_score?.toString() || "");
      setEvalRisk(existing.risk_score?.toString() || "");
      setEvalCost(existing.cost_score?.toString() || "");
    } else {
      setEditingId(null);
      setEvalStatus("ALLOWED");
      setEvalRationale("");
      setEvalVersion("v1");
      setEvalValue("");
      setEvalRisk("");
      setEvalCost("");
    }
    setEvalFormOpen(true);
  };

  const handleSaveEval = async () => {
    if (!evalItem) return;
    setSaving(true);
    const payload: any = {
      tool_id: evalItem.type === "tool" ? evalItem.id : null,
      model_id: evalItem.type === "model" ? evalItem.id : null,
      decided_status: evalStatus,
      rationale: evalRationale || null,
      version: evalVersion || "v1",
      value_score: evalValue ? parseInt(evalValue) : null,
      risk_score: evalRisk ? parseInt(evalRisk) : null,
      cost_score: evalCost ? parseInt(evalCost) : null,
    };

    try {
      if (editingId) {
        await adminAction({ action: "update", table: "evaluations", id: editingId, payload });
        toast({ title: t("admin.evaluation_updated") });
      } else {
        await adminAction({ action: "insert", table: "evaluations", payload });
        toast({ title: t("admin.evaluation_created") });
      }
      setEvalFormOpen(false);
      onRefresh();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEval = async (evalId: string) => {
    try {
      await adminAction({ action: "delete", table: "evaluations", id: evalId });
      toast({ title: t("admin.evaluation_deleted") });
      setSelectedItem(null);
      onRefresh();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const progressPct = stats.total > 0 ? (stats.evaluated / stats.total) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Progress overview */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t("admin.eval_dashboard_title")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("admin.eval_dashboard_desc")}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums">{stats.evaluated}<span className="text-lg text-muted-foreground font-normal">/{stats.total}</span></p>
            <p className="text-xs text-muted-foreground">{t("admin.evaluated_count")}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Progress value={progressPct} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPct)}% {t("admin.complete")}</span>
            {stats.unevaluated > 0 && (
              <button
                className="text-primary hover:underline font-medium"
                onClick={() => { setFilterStatus("UNCLASSIFIED"); setSortBy("popularity"); }}
              >
                {stats.unevaluated} {t("admin.remaining")} →
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <StatBadge
            icon={<CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
            label={t("status.allowed")} count={stats.allowed}
            active={filterStatus === "ALLOWED"}
            onClick={() => setFilterStatus(filterStatus === "ALLOWED" ? "ALL" : "ALLOWED")}
          />
          <StatBadge
            icon={<CircleX className="h-3.5 w-3.5 text-destructive" />}
            label={t("status.not_allowed")} count={stats.notAllowed}
            active={filterStatus === "NOT_ALLOWED"}
            onClick={() => setFilterStatus(filterStatus === "NOT_ALLOWED" ? "ALL" : "NOT_ALLOWED")}
          />
          <StatBadge
            icon={<FlaskConical className="h-3.5 w-3.5" />}
            label={t("status.trial")} count={stats.trial}
            active={filterStatus === "TRIAL"}
            onClick={() => setFilterStatus(filterStatus === "TRIAL" ? "ALL" : "TRIAL")}
          />
          <StatBadge
            icon={<AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />}
            label={t("admin.unclassified_label")} count={stats.unevaluated}
            active={filterStatus === "UNCLASSIFIED"}
            onClick={() => setFilterStatus(filterStatus === "UNCLASSIFIED" ? "ALL" : "UNCLASSIFIED")}
          />
          <StatBadge
            icon={<TrendingUp className="h-3.5 w-3.5 text-primary" />}
            label={t("admin.has_catalog")} count={stats.withCatalog}
            active={false}
            onClick={() => {}}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("admin.search_items")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.all_types")}</SelectItem>
            <SelectItem value="tool"><span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> {t("common.tools")}</span></SelectItem>
            <SelectItem value="model"><span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> {t("common.models")}</span></SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">{t("admin.sort_popularity")}</SelectItem>
            <SelectItem value="status">{t("admin.sort_status")}</SelectItem>
            <SelectItem value="name">{t("admin.sort_name")}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} {t("admin.items_shown")}</span>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground py-8 text-center">{t("admin.no_items_found")}</p>}
        {filtered.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            totalSubmissions={submissions.length}
            onEvaluate={() => openEvalForm(item, item.evaluation)}
            onViewDetail={() => setSelectedItem(item)}
            t={t}
          />
        ))}
      </div>

      {/* Evaluation form dialog */}
      <Dialog open={evalFormOpen} onOpenChange={setEvalFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {evalItem?.type === "tool" ? <Wrench className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              {editingId ? t("admin.edit_evaluation") : t("admin.new_evaluation")} – {evalItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Submission context */}
            {evalItem && evalItem.submissionCount > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {t("admin.submission_context")}
                </p>
                <p className="text-muted-foreground">
                  {evalItem.submissionCount} {t("admin.mentions")} ({Math.round((evalItem.submissionCount / Math.max(submissions.length, 1)) * 100)}% {t("admin.of_respondents")})
                  {evalItem.mustKeepCount > 0 && <> · ★ {evalItem.mustKeepCount}× {t("admin.must_keep_short")}</>}
                </p>
                {evalItem.useCases.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {evalItem.useCases.map(uc => <Badge key={uc} variant="outline" className="text-xs">{uc}</Badge>)}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t("status.set_status")}</Label>
                <Select value={evalStatus} onValueChange={setEvalStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALLOWED"><span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5" /> {t("status.allowed")}</span></SelectItem>
                    <SelectItem value="NOT_ALLOWED"><span className="flex items-center gap-1.5"><CircleX className="h-3.5 w-3.5" /> {t("status.not_allowed")}</span></SelectItem>
                    <SelectItem value="TRIAL"><span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> {t("status.trial")}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">{t("admin.value")}</Label>
                  <Input type="number" min="1" max="5" placeholder="–" value={evalValue} onChange={e => setEvalValue(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{t("admin.risk")}</Label>
                  <Input type="number" min="1" max="5" placeholder="–" value={evalRisk} onChange={e => setEvalRisk(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">{t("admin.cost")}</Label>
                  <Input type="number" min="1" max="5" placeholder="–" value={evalCost} onChange={e => setEvalCost(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Version</Label>
                  <Input placeholder="v1" value={evalVersion} onChange={e => setEvalVersion(e.target.value)} />
                </div>
              </div>

              <div>
                <Label className="text-xs">{t("admin.rationale")}</Label>
                <Textarea
                  placeholder={t("admin.rationale_placeholder")}
                  value={evalRationale}
                  onChange={e => setEvalRationale(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEvalFormOpen(false)}>{t("common.cancel")}</Button>
              <Button size="sm" onClick={handleSaveEval} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {editingId ? t("common.update") : t("common.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem?.type === "tool" ? <Wrench className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Info */}
              <div className="text-sm space-y-1">
                {selectedItem.vendor && <p><strong>{t("form.provider")}:</strong> {selectedItem.vendor}</p>}
                {selectedItem.provider && <p><strong>{t("form.provider")}:</strong> {selectedItem.provider}</p>}
                {selectedItem.category && <p><strong>{t("form.category")}:</strong> {selectedItem.category}</p>}
              </div>

              {/* Submission data */}
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1.5">
                <p className="font-medium flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {t("admin.from_submissions")}</p>
                <p>{selectedItem.submissionCount} {t("admin.mentions")} {submissions.length > 0 && `(${Math.round((selectedItem.submissionCount / submissions.length) * 100)}%)`}</p>
                {selectedItem.mustKeepCount > 0 && <p>★ {selectedItem.mustKeepCount}× {t("admin.marked_must_keep")}</p>}
                {selectedItem.useCases.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {selectedItem.useCases.map(uc => <Badge key={uc} variant="outline" className="text-xs">{uc}</Badge>)}
                  </div>
                )}
              </div>

              {/* Current evaluation */}
              {selectedItem.evaluation ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("admin.current_evaluation")}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const cfg = statusConfig[selectedItem.evaluation.decided_status as keyof typeof statusConfig];
                      const Icon = cfg?.icon;
                      return cfg ? (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cfg.badgeClass}`}>
                          {Icon && <Icon className="h-3.5 w-3.5" />} {t(cfg.label)}
                        </span>
                      ) : null;
                    })()}
                    {selectedItem.evaluation.version && <Badge variant="outline" className="text-xs">{selectedItem.evaluation.version}</Badge>}
                  </div>
                  {(selectedItem.evaluation.value_score || selectedItem.evaluation.risk_score || selectedItem.evaluation.cost_score) && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="border rounded p-2">
                        <p className="text-xs text-muted-foreground">{t("admin.value")}</p>
                        <p className="font-bold">{selectedItem.evaluation.value_score || "–"}</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="text-xs text-muted-foreground">{t("admin.risk")}</p>
                        <p className="font-bold">{selectedItem.evaluation.risk_score || "–"}</p>
                      </div>
                      <div className="border rounded p-2">
                        <p className="text-xs text-muted-foreground">{t("admin.cost")}</p>
                        <p className="font-bold">{selectedItem.evaluation.cost_score || "–"}</p>
                      </div>
                    </div>
                  )}
                  {selectedItem.evaluation.rationale && <p className="text-sm text-muted-foreground">{selectedItem.evaluation.rationale}</p>}
                  <p className="text-xs text-muted-foreground">{t("admin.decided")}: {new Date(selectedItem.evaluation.decided_at).toLocaleString("nb-NO")}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t("admin.not_yet_evaluated")}</p>
              )}

              {/* Catalog status */}
              <div className="text-sm">
                <p className="font-medium">{t("form.catalog_entry")}</p>
                <p className="text-muted-foreground">
                  {selectedItem.catalogEntry ? `✓ ${t("admin.has_catalog_entry")}` : `✗ ${t("admin.no_catalog_entry")}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => { openEvalForm(selectedItem, selectedItem.evaluation); setSelectedItem(null); }}
                  className="gap-1.5"
                >
                  {selectedItem.evaluation ? <><Pencil className="h-3.5 w-3.5" /> {t("admin.edit_evaluation")}</> : <><Plus className="h-3.5 w-3.5" /> {t("admin.new_evaluation")}</>}
                </Button>
                {selectedItem.evaluation && (
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteEval(selectedItem.evaluation.id)} className="gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBadge({ icon, label, count, active, onClick }: {
  icon: React.ReactNode; label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50 ${active ? "border-primary bg-primary/5" : "border-border"}`}
    >
      {icon}
      <div>
        <p className="text-lg font-bold tabular-nums leading-tight">{count}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </div>
    </button>
  );
}

function ItemRow({ item, totalSubmissions, onEvaluate, onViewDetail, t }: {
  item: UnifiedItem;
  totalSubmissions: number;
  onEvaluate: () => void;
  onViewDetail: () => void;
  t: (key: any, params?: Record<string, string | number>) => string;
}) {
  const hasEval = !!item.evaluation;
  const cfg = hasEval ? statusConfig[item.evaluation.decided_status as keyof typeof statusConfig] : null;
  const StatusIcon = cfg?.icon;
  const popularityPct = totalSubmissions > 0 ? (item.submissionCount / totalSubmissions) * 100 : 0;

  return (
    <div
      className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30 cursor-pointer ${!hasEval ? "border-dashed border-muted-foreground/30" : ""}`}
      onClick={onViewDetail}
    >
      {/* Type icon */}
      <div className="shrink-0">
        {item.type === "tool" ? <Wrench className="h-4 w-4 text-muted-foreground" /> : <Brain className="h-4 w-4 text-muted-foreground" />}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{item.name}</span>
          {item.mustKeepCount > 0 && (
            <Tooltip>
              <TooltipTrigger><span className="text-xs">★</span></TooltipTrigger>
              <TooltipContent className="text-xs">{item.mustKeepCount}× {t("admin.must_keep_short")}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{item.vendor || item.provider || ""}</span>
          {item.submissionCount > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <Users className="h-3 w-3" /> {item.submissionCount}
            </span>
          )}
        </div>
      </div>

      {/* Popularity bar */}
      {item.submissionCount > 0 && (
        <div className="hidden sm:block w-20 shrink-0">
          <Progress value={popularityPct} className="h-1.5" />
        </div>
      )}

      {/* Status */}
      <div className="shrink-0 w-28 text-right">
        {hasEval && cfg ? (
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cfg.badgeClass}`}>
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {t(cfg.label)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("status.not_classified")}</span>
        )}
      </div>

      {/* Action */}
      <Button
        variant={hasEval ? "ghost" : "default"}
        size="sm"
        className="shrink-0 gap-1 text-xs opacity-80 group-hover:opacity-100"
        onClick={(e) => { e.stopPropagation(); onEvaluate(); }}
      >
        {hasEval ? <Pencil className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
        {hasEval ? t("common.edit") : t("admin.classify")}
      </Button>
    </div>
  );
}
