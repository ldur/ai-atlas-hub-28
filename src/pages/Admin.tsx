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
import { adminAction, verifyAdmin } from "@/lib/adminAction";
import { getAdminToken, setAdminToken } from "@/lib/nickname";

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
      <Tabs defaultValue="evaluations">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="evaluations">{t("admin.evaluations")}</TabsTrigger>
          <TabsTrigger value="submissions">{t("admin.submissions")}</TabsTrigger>
          <TabsTrigger value="surveys">{t("surveys.title")}</TabsTrigger>
          <TabsTrigger value="shared-links">{t("admin.shared_links")}</TabsTrigger>
        </TabsList>
        <TabsContent value="evaluations"><EvaluationsTab /></TabsContent>
        <TabsContent value="submissions"><SubmissionsTab /></TabsContent>
        <TabsContent value="surveys"><SurveysTab /></TabsContent>
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
  const [surveys, setSurveys] = useState<any[]>([]);
  const [surveyFilter, setSurveyFilter] = useState<string>("all");
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
      supabase.from("surveys").select("id, title, is_active").order("created_at"),
    ]).then(([sRes, tRes, mRes, eRes, survRes]) => {
      setSubmissions(sRes.data || []);
      setTools(tRes.data || []);
      setModels(mRes.data || []);
      setEvaluations(eRes.data || []);
      setSurveys(survRes.data || []);
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

  const surveyFiltered = surveyFilter === "all" ? submissions : submissions.filter(s => s.survey_id === surveyFilter);
  const filtered = surveyFiltered.filter(s => {
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
        {surveys.length > 0 && (
          <Select value={surveyFilter} onValueChange={setSurveyFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("surveys.all")}</SelectItem>
              {surveys.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
  const [tools, setTools] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [catalogEntries, setCatalogEntries] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const fetchAll = () => {
    Promise.all([
      supabase.from("tools").select("*").order("name"),
      supabase.from("models").select("*").order("name"),
      supabase.from("evaluations").select("*").order("decided_at", { ascending: false }),
      supabase.from("catalog_entries").select("id, tool_id, model_id"),
      supabase.from("submissions").select("tools_used, models_used, use_cases, must_keep_tool"),
    ]).then(([t, m, e, c, s]) => {
      setTools(t.data || []);
      setModels(m.data || []);
      setEvaluations(e.data || []);
      setCatalogEntries(c.data || []);
      setSubmissions(s.data || []);
    });
  };
  useEffect(() => { fetchAll(); }, []);

  return (
    <div className="mt-4">
      <EvaluationDashboard
        tools={tools}
        models={models}
        evaluations={evaluations}
        catalogEntries={catalogEntries}
        submissions={submissions}
        onRefresh={fetchAll}
      />
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
