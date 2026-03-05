import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { adminAction } from "@/lib/adminAction";
import { getAdminToken, setAdminToken } from "@/lib/nickname";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import {
  Lock, Sparkles, Loader2, Wrench, Brain, Download, Trash2, Pencil, Plus,
  CircleCheck, CircleMinus, CircleX, FlaskConical, ClipboardList, History,
  Link2, ExternalLink, Check, X
} from "lucide-react";
import { SubmissionAnalytics } from "@/components/admin/SubmissionAnalytics";

const ADMIN_CODE = "atlas-admin-2024";

function BulkGenerateSection() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ type: string; name: string; status: string }[]>([]);
  const { toast } = useToast();
  const { t } = useI18n();

  const runBulk = async (type: "tool" | "model") => {
    setRunning(true);
    let remaining = 999;
    const allResults: { type: string; name: string; status: string }[] = [];

    try {
      while (remaining > 0) {
        const { data, error } = await supabase.functions.invoke("bulk-generate-catalog", {
          body: { type, batch_size: 3 },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        remaining = data.remaining || 0;
        for (const r of data.results || []) {
          allResults.push({ type, ...r });
        }
        setResults([...allResults]);

        if (data.processed === 0) break;
      }
      toast({ title: `${allResults.length} ${type === "tool" ? t("common.tools").toLowerCase() : t("common.models").toLowerCase()} generated.` });
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const runAll = async () => {
    await runBulk("tool");
    await runBulk("model");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> {t("admin.bulk_title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{t("admin.bulk_desc")}</p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => runBulk("tool")} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
            {running ? t("admin.running") : t("admin.gen_tools")}
          </Button>
          <Button size="sm" onClick={() => runBulk("model")} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            {running ? t("admin.running") : t("admin.gen_models")}
          </Button>
          <Button size="sm" variant="outline" onClick={runAll} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {running ? t("admin.running") : t("admin.gen_all")}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2">
            {results.map((r, i) => (
              <div key={i} className="flex gap-2 items-center">
                {r.type === "tool" ? <Wrench className="h-3 w-3" /> : <Brain className="h-3 w-3" />}
                <span className="font-medium">{r.name}</span>
                <span className={r.status === "success" ? "text-success" : "text-destructive"}>{r.status}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    const saved = getAdminToken();
    if (saved === ADMIN_CODE) setAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (code === ADMIN_CODE) {
      setAdminToken(code);
      setAuthenticated(true);
    } else {
      toast({ title: t("admin.wrong_code"), variant: "destructive" });
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto mt-12 space-y-4">
        <div className="text-center space-y-2">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-muted-foreground">{t("admin.enter_code")}</p>
        </div>
        <Input
          type="password"
          placeholder={t("admin.code_placeholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <Button className="w-full" onClick={handleLogin}>{t("admin.login")}</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("admin.title")}</h1>
      <BulkGenerateSection />
      <Tabs defaultValue="submissions">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="submissions">{t("admin.submissions")}</TabsTrigger>
          <TabsTrigger value="evaluations">{t("admin.evaluations")}</TabsTrigger>
          <TabsTrigger value="shared-links">{t("admin.shared_links")}</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions"><SubmissionsTab /></TabsContent>
        <TabsContent value="evaluations"><EvaluationsTab /></TabsContent>
        <TabsContent value="shared-links"><SharedLinksTab /></TabsContent>
      </Tabs>
    </div>
  );
};

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalEntityType, setEvalEntityType] = useState<"tool" | "model">("tool");
  const [evalEntityId, setEvalEntityId] = useState("");
  const [evalStatus, setEvalStatus] = useState("ALLOWED");
  const [evalRationale, setEvalRationale] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchAll = () => {
    Promise.all([
      supabase.from("submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("tools").select("id, name").order("name"),
      supabase.from("models").select("id, name").order("name"),
      supabase.from("evaluations").select("id, tool_id, model_id, decided_status"),
    ]).then(([sRes, tRes, mRes, eRes]) => {
      setSubmissions(sRes.data || []);
      setTools(tRes.data || []);
      setModels(mRes.data || []);
      setEvaluations(eRes.data || []);
    });
  };
  useEffect(() => { fetchAll(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminAction({ action: "delete", table: "submissions", id });
      toast({ title: t("admin.submission_deleted") });
      setSelectedSubmission(null);
      fetchAll();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const exportCsv = () => {
    const headers = ["Date", "Team", "Role", "Tools", "Freetext", "Models", "Use cases", "Time saved", "Sensitive data", "Challenges", "Must keep"];
    const rows = submissions.map(s => [
      new Date(s.created_at).toLocaleString("nb-NO"),
      s.team || "", s.role || "",
      (s.tools_used || []).join("; "), s.tools_freetext || "",
      (s.models_used || []).join("; "), (s.use_cases || []).join("; "),
      s.time_saved_range || "", s.data_sensitivity || "",
      s.pain_points || "", s.must_keep_tool || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: t("admin.csv_exported") });
  };

  const filtered = submissions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [
      ...(s.tools_used || []), ...(s.models_used || []), ...(s.use_cases || []),
      s.tools_freetext, s.pain_points, s.must_keep_tool, s.team, s.role,
    ].some(v => v && String(v).toLowerCase().includes(q));
  });

  const handleCreateEvaluation = (type: "tool" | "model", entityId: string) => {
    setEvalEntityType(type);
    setEvalEntityId(entityId);
    setEvalStatus("ALLOWED");
    setEvalRationale("");
    setShowEvalForm(true);
  };

  const handleSaveEvaluation = async () => {
    if (!evalEntityId) return;
    try {
      await adminAction({
        action: "insert",
        table: "evaluations",
        payload: {
          tool_id: evalEntityType === "tool" ? evalEntityId : null,
          model_id: evalEntityType === "model" ? evalEntityId : null,
          decided_status: evalStatus,
          rationale: evalRationale || null,
        },
      });
      toast({ title: t("admin.evaluation_created") });
      setShowEvalForm(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const evalEntityName = evalEntityType === "tool"
    ? tools.find(t => t.id === evalEntityId)?.name
    : models.find(m => m.id === evalEntityId)?.name;

  return (
    <div className="space-y-4 mt-4">
      <SubmissionAnalytics
        submissions={submissions}
        tools={tools}
        models={models}
        evaluations={evaluations}
        onCreateEvaluation={handleCreateEvaluation}
      />

      {/* Quick classify dialog */}
      <Dialog open={showEvalForm} onOpenChange={setShowEvalForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {t("admin.classify")} – {evalEntityName || ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={evalStatus} onValueChange={setEvalStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALLOWED"><span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5" /> {t("status.allowed")}</span></SelectItem>
                <SelectItem value="NOT_ALLOWED"><span className="flex items-center gap-1.5"><CircleX className="h-3.5 w-3.5" /> {t("status.not_allowed")}</span></SelectItem>
                <SelectItem value="TRIAL"><span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> {t("status.trial")}</span></SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder={t("admin.rationale_placeholder")}
              value={evalRationale}
              onChange={e => setEvalRationale(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowEvalForm(false)}>{t("common.cancel")}</Button>
              <Button size="sm" onClick={handleSaveEvaluation}>{t("common.create")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 items-center flex-wrap">
        <Input placeholder={t("admin.search_submissions")} value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[200px]" />
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={submissions.length === 0} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> {t("admin.export_csv")}
        </Button>
        <span className="text-sm text-muted-foreground">{filtered.length} / {submissions.length}</span>
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground">{t("admin.no_submissions")}</p>}
      {filtered.map((s) => (
        <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedSubmission(s)}>
          <CardContent className="p-4 text-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="flex gap-2 flex-wrap items-center">
                  {(s.tools_used || []).slice(0, 3).map((tool: string) => <Badge key={tool} variant="secondary">{tool}</Badge>)}
                  {(s.tools_used || []).length > 3 && <Badge variant="outline">+{(s.tools_used || []).length - 3}</Badge>}
                </div>
                <p className="text-muted-foreground">
                  {s.time_saved_range ? `${s.time_saved_range}h` : "–"} · {new Date(s.created_at).toLocaleDateString("nb-NO")}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.submissions")} – {selectedSubmission && new Date(selectedSubmission.created_at).toLocaleString("nb-NO")}</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-3 text-sm">
              {selectedSubmission.team && <p><strong>{t("admin.team")}:</strong> {selectedSubmission.team}</p>}
              {selectedSubmission.role && <p><strong>{t("admin.role")}:</strong> {selectedSubmission.role}</p>}
              <p><strong>{t("common.tools")}:</strong> {(selectedSubmission.tools_used || []).join(", ") || "–"}</p>
              {selectedSubmission.tools_freetext && <p><strong>{t("admin.freetext")}:</strong> {selectedSubmission.tools_freetext}</p>}
              <p><strong>{t("common.models")}:</strong> {(selectedSubmission.models_used || []).join(", ") || "–"}</p>
              <p><strong>{t("survey.what_for")}:</strong> {(selectedSubmission.use_cases || []).join(", ") || "–"}</p>
              <p><strong>{t("admin.time_saved")}:</strong> {selectedSubmission.time_saved_range || "–"}</p>
              <p><strong>{t("admin.sensitive_data")}:</strong> {selectedSubmission.data_sensitivity || "–"}</p>
              {selectedSubmission.pain_points && <p><strong>{t("admin.challenges")}:</strong> {selectedSubmission.pain_points}</p>}
              {selectedSubmission.must_keep_tool && <p><strong>{t("admin.must_keep")}:</strong> {selectedSubmission.must_keep_tool}</p>}
              <div className="flex justify-end pt-2">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedSubmission.id)} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> {t("admin.delete_submission")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


function EvaluationsTab() {
  const [evals, setEvals] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState<"all" | "tool" | "model">("all");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [entityType, setEntityType] = useState<"tool" | "model">("tool");
  const [entityId, setEntityId] = useState("");
  const [status, setStatus] = useState("ALLOWED");
  const [rationale, setRationale] = useState("");
  const [version, setVersion] = useState("v1");
  const [valueScore, setValueScore] = useState("");
  const [riskScore, setRiskScore] = useState("");
  const [costScore, setCostScore] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { toast } = useToast();
  const { t } = useI18n();

  const fetchAll = () => {
    Promise.all([
      supabase.from("evaluations").select("*").order("decided_at", { ascending: false }),
      supabase.from("tools").select("*").order("name"),
      supabase.from("models").select("*").order("name"),
    ]).then(([e, tRes, m]) => {
      setEvals(e.data || []);
      setTools(tRes.data || []);
      setModels(m.data || []);
    });
  };
  useEffect(() => { fetchAll(); }, []);

  const getName = (ev: any) => {
    if (ev.tool_id) return tools.find(tool => tool.id === ev.tool_id)?.name || t("common.unknown");
    if (ev.model_id) return models.find(m => m.id === ev.model_id)?.name || t("common.unknown");
    return "–";
  };

  const getType = (ev: any) => ev.tool_id ? "tool" : ev.model_id ? "model" : "unknown";

  const statusColors: Record<string, string> = {
    ALLOWED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    NOT_ALLOWED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    TRIAL: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  const resetForm = () => {
    setEntityType("tool"); setEntityId(""); setStatus("ALLOWED"); setRationale("");
    setVersion("v1"); setValueScore(""); setRiskScore(""); setCostScore("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (ev: any) => {
    setEntityType(ev.tool_id ? "tool" : "model");
    setEntityId(ev.tool_id || ev.model_id || "");
    setStatus(ev.decided_status);
    setRationale(ev.rationale || "");
    setVersion(ev.version || "v1");
    setValueScore(ev.value_score?.toString() || "");
    setRiskScore(ev.risk_score?.toString() || "");
    setCostScore(ev.cost_score?.toString() || "");
    setEditingId(ev.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!entityId) { toast({ title: t("admin.select_entity"), variant: "destructive" }); return; }
    const payload: any = {
      tool_id: entityType === "tool" ? entityId : null,
      model_id: entityType === "model" ? entityId : null,
      decided_status: status,
      rationale: rationale || null,
      version: version || "v1",
      value_score: valueScore ? parseInt(valueScore) : null,
      risk_score: riskScore ? parseInt(riskScore) : null,
      cost_score: costScore ? parseInt(costScore) : null,
    };

    try {
      if (editingId) {
        await adminAction({ action: "update", table: "evaluations", id: editingId, payload });
        toast({ title: t("admin.evaluation_updated") });
      } else {
        await adminAction({ action: "insert", table: "evaluations", payload });
        toast({ title: t("admin.evaluation_created") });
      }
      resetForm();
      fetchAll();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAction({ action: "delete", table: "evaluations", id });
      toast({ title: t("admin.evaluation_deleted") });
      fetchAll();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const entities = entityType === "tool" ? tools : models;

  const filtered = evals.filter(ev => {
    if (filterStatus !== "ALL" && ev.decided_status !== filterStatus) return false;
    if (filterType === "tool" && !ev.tool_id) return false;
    if (filterType === "model" && !ev.model_id) return false;
    return true;
  });

  const getHistoryForEntity = (ev: any) => {
    const key = ev.tool_id || ev.model_id;
    return evals.filter(e => (e.tool_id || e.model_id) === key).sort((a, b) =>
      new Date(b.decided_at).getTime() - new Date(a.decided_at).getTime()
    );
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-2 flex-wrap items-center">
        <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.all_types")}</SelectItem>
            <SelectItem value="tool"><span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> {t("common.tools")}</span></SelectItem>
            <SelectItem value="model"><span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> {t("common.models")}</span></SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("status.all_statuses")}</SelectItem>
            <SelectItem value="ALLOWED">{t("status.allowed")}</SelectItem>
            <SelectItem value="NOT_ALLOWED">{t("status.not_allowed")}</SelectItem>
            <SelectItem value="TRIAL">{t("status.trial")}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} {t("admin.evaluations").toLowerCase()}</span>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t("admin.new_evaluation")}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              {editingId ? <><Pencil className="h-4 w-4" /> {t("admin.edit_evaluation")}</> : <><Plus className="h-4 w-4" /> {t("admin.new_evaluation")}</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={entityType} onValueChange={(v: any) => { setEntityType(v); setEntityId(""); }}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool"><span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> {t("common.tools")}</span></SelectItem>
                  <SelectItem value="model"><span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> {t("common.models")}</span></SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder={entityType === "tool" ? t("admin.select_tool") : t("admin.select_model")} /></SelectTrigger>
                <SelectContent>
                  {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALLOWED"><span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5" /> {t("status.allowed")}</span></SelectItem>
                  <SelectItem value="NOT_ALLOWED"><span className="flex items-center gap-1.5"><CircleX className="h-3.5 w-3.5" /> {t("status.not_allowed")}</span></SelectItem>
                  <SelectItem value="TRIAL"><span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> {t("status.trial")}</span></SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Version (e.g. v1)" value={version} onChange={e => setVersion(e.target.value)} className="w-[120px]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">{t("admin.value")} (1-5)</Label>
                <Input type="number" min="1" max="5" placeholder="–" value={valueScore} onChange={e => setValueScore(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t("admin.risk")} (1-5)</Label>
                <Input type="number" min="1" max="5" placeholder="–" value={riskScore} onChange={e => setRiskScore(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t("admin.cost")} (1-5)</Label>
                <Input type="number" min="1" max="5" placeholder="–" value={costScore} onChange={e => setCostScore(e.target.value)} />
              </div>
            </div>
            <Textarea placeholder={t("admin.rationale_placeholder")} value={rationale} onChange={e => setRationale(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>{t("common.cancel")}</Button>
              <Button size="sm" onClick={handleSave}>{editingId ? t("common.update") : t("common.create")}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && <p className="text-muted-foreground">{t("admin.no_evaluations")}</p>}
      {filtered.map((ev) => (
        <Card key={ev.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedItem(ev)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {getType(ev) === "tool" ? <Wrench className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                <span className="font-medium">{getName(ev)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[ev.decided_status] || ""}`}>
                  {ev.decided_status}
                </span>
                {ev.version && <Badge variant="outline" className="text-xs">{ev.version}</Badge>}
                {(ev.value_score || ev.risk_score || ev.cost_score) && (
                  <span className="text-xs text-muted-foreground">
                    V:{ev.value_score || "–"} R:{ev.risk_score || "–"} C:{ev.cost_score || "–"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); startEdit(ev); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(ev.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {ev.rationale && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{ev.rationale}</p>}
            <p className="text-xs text-muted-foreground mt-1">{new Date(ev.decided_at).toLocaleString("nb-NO")}</p>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && (
                <>
                  {getType(selectedItem) === "tool" ? <Wrench className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
                  {getName(selectedItem)}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedItem.decided_status] || ""}`}>
                    {selectedItem.decided_status}
                  </span>
                  {selectedItem.version && <Badge variant="outline">{selectedItem.version}</Badge>}
                </div>
                {(selectedItem.value_score || selectedItem.risk_score || selectedItem.cost_score) && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="border rounded p-2">
                      <p className="text-xs text-muted-foreground">{t("admin.value")}</p>
                      <p className="font-bold">{selectedItem.value_score || "–"}</p>
                    </div>
                    <div className="border rounded p-2">
                      <p className="text-xs text-muted-foreground">{t("admin.risk")}</p>
                      <p className="font-bold">{selectedItem.risk_score || "–"}</p>
                    </div>
                    <div className="border rounded p-2">
                      <p className="text-xs text-muted-foreground">{t("admin.cost")}</p>
                      <p className="font-bold">{selectedItem.cost_score || "–"}</p>
                    </div>
                  </div>
                )}
                {selectedItem.rationale && <p><strong>{t("admin.rationale")}:</strong> {selectedItem.rationale}</p>}
                <p className="text-xs text-muted-foreground">{t("admin.decided")}: {new Date(selectedItem.decided_at).toLocaleString("nb-NO")}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><History className="h-4 w-4" /> {t("admin.eval_history")}</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getHistoryForEntity(selectedItem).map((h) => (
                    <div key={h.id} className={`text-xs border rounded p-2 ${h.id === selectedItem.id ? "border-primary bg-primary/5" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded ${statusColors[h.decided_status] || ""}`}>{h.decided_status}</span>
                        {h.version && <span className="text-muted-foreground">{h.version}</span>}
                        <span className="text-muted-foreground ml-auto">{new Date(h.decided_at).toLocaleDateString("nb-NO")}</span>
                      </div>
                      {h.rationale && <p className="text-muted-foreground mt-1">{h.rationale}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => { startEdit(selectedItem); setSelectedItem(null); }} className="gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> {t("common.edit")}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { handleDelete(selectedItem.id); }} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> {t("common.delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


function SharedLinksTab() {
  const [links, setLinks] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "published">("all");
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchLinks = () => supabase.from("shared_links").select("*").order("created_at", { ascending: false }).then(({ data }) => setLinks(data || []));
  useEffect(() => { fetchLinks(); }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminAction({ action: "update", table: "shared_links", id, payload: { published: true } });
      toast({ title: t("admin.link_approved") });
      fetchLinks();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminAction({ action: "delete", table: "shared_links", id });
      toast({ title: t("admin.link_rejected") });
      fetchLinks();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const filtered = links.filter(l => {
    if (filter === "pending") return !l.published;
    if (filter === "published") return l.published;
    return true;
  });

  const pendingCount = links.filter(l => !l.published).length;

  return (
    <div className="space-y-3 mt-4">
      <div className="flex gap-2 items-center flex-wrap">
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.filter_links")}</SelectItem>
            <SelectItem value="pending">{t("admin.pending_only")}</SelectItem>
            <SelectItem value="published">{t("admin.published_only")}</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} / {links.length}</span>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="ml-auto">{pendingCount} {t("admin.pending").toLowerCase()}</Badge>
        )}
      </div>

      {filtered.length === 0 && <p className="text-muted-foreground">{t("admin.no_links")}</p>}

      {filtered.map((link) => (
        <Card key={link.id} className={!link.published ? "border-amber-300 dark:border-amber-700" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{link.title || link.url}</span>
                  <Badge variant={link.published ? "default" : "secondary"} className="text-xs shrink-0">
                    {link.published ? t("admin.published") : t("admin.pending")}
                  </Badge>
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">
                  {link.url}
                </a>
                {link.description && <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>}
                <p className="text-xs text-muted-foreground">{new Date(link.created_at).toLocaleDateString("nb-NO")}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!link.published && (
                  <Button variant="outline" size="icon" onClick={() => handleApprove(link.id)} title={t("admin.approve")}>
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => handleReject(link.id)} title={t("admin.reject")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default Admin;
