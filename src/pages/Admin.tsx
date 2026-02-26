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
import {
  Lock, Sparkles, Loader2, Wrench, Brain, Download, Trash2, Pencil, Plus,
  CircleCheck, CircleMinus, CircleX, FlaskConical, ClipboardList, History
} from "lucide-react";

const ADMIN_CODE = "atlas-admin-2024";

function BulkGenerateSection() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{ type: string; name: string; status: string }[]>([]);
  const { toast } = useToast();

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
      toast({ title: `Ferdig! ${allResults.length} ${type === "tool" ? "verktøy" : "modeller"} generert.` });
    } catch (e: any) {
      toast({ title: "Feil", description: e.message, variant: "destructive" });
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
        <CardTitle className="text-base flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Bulk AI-generering av katalogoppføringer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Generer kataloginnhold automatisk for alle verktøy og modeller som mangler oppføring.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => runBulk("tool")} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wrench className="h-3.5 w-3.5" />}
            {running ? "Kjører..." : "Generer for verktøy"}
          </Button>
          <Button size="sm" onClick={() => runBulk("model")} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
            {running ? "Kjører..." : "Generer for modeller"}
          </Button>
          <Button size="sm" variant="outline" onClick={runAll} disabled={running} className="gap-1.5">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {running ? "Kjører..." : "Generer for alle"}
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

  useEffect(() => {
    const saved = getAdminToken();
    if (saved === ADMIN_CODE) setAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (code === ADMIN_CODE) {
      setAdminToken(code);
      setAuthenticated(true);
    } else {
      toast({ title: "Feil kode", variant: "destructive" });
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-sm mx-auto mt-12 space-y-4">
        <div className="text-center space-y-2">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-muted-foreground">Skriv inn admin-koden for tilgang</p>
        </div>
        <Input
          type="password"
          placeholder="Admin-kode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />
        <Button className="w-full" onClick={handleLogin}>Logg inn</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
      <BulkGenerateSection />
      <Tabs defaultValue="submissions">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="submissions">Innleveringer</TabsTrigger>
          <TabsTrigger value="evaluations">Evalueringer</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions"><SubmissionsTab /></TabsContent>
        <TabsContent value="evaluations"><EvaluationsTab /></TabsContent>
      </Tabs>
    </div>
  );
};

function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const { toast } = useToast();

  const fetchSubmissions = () => supabase.from("submissions").select("*").order("created_at", { ascending: false }).then(({ data }) => setSubmissions(data || []));
  useEffect(() => { fetchSubmissions(); }, []);

  const handleDelete = async (id: string) => {
    try {
      await adminAction({ action: "delete", table: "submissions", id });
      toast({ title: "Innlevering slettet" });
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (e: any) {
      toast({ title: "Feil", description: e.message, variant: "destructive" });
    }
  };

  const exportCsv = () => {
    const headers = ["Dato", "Team", "Rolle", "Verktøy", "Fritekst", "Modeller", "Bruksområder", "Tid spart", "Sensitiv data", "Utfordringer", "Må beholde"];
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
    a.href = url; a.download = `innleveringer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "CSV eksportert" });
  };

  const filtered = submissions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [
      ...(s.tools_used || []), ...(s.models_used || []), ...(s.use_cases || []),
      s.tools_freetext, s.pain_points, s.must_keep_tool, s.team, s.role,
    ].some(v => v && String(v).toLowerCase().includes(q));
  });

  return (
    <div className="space-y-3 mt-4">
      <div className="flex gap-2 items-center flex-wrap">
        <Input placeholder="Søk i innleveringer..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[200px]" />
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={submissions.length === 0} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Eksporter CSV
        </Button>
        <span className="text-sm text-muted-foreground">{filtered.length} av {submissions.length}</span>
      </div>
      {filtered.length === 0 && <p className="text-muted-foreground">Ingen innleveringer funnet.</p>}
      {filtered.map((s) => (
        <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedSubmission(s)}>
          <CardContent className="p-4 text-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="flex gap-2 flex-wrap items-center">
                  {(s.tools_used || []).slice(0, 3).map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  {(s.tools_used || []).length > 3 && <Badge variant="outline">+{(s.tools_used || []).length - 3}</Badge>}
                </div>
                <p className="text-muted-foreground">
                  {s.time_saved_range ? `${s.time_saved_range}t spart` : "–"} · {new Date(s.created_at).toLocaleDateString("nb-NO")}
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
            <DialogTitle>Innlevering – {selectedSubmission && new Date(selectedSubmission.created_at).toLocaleString("nb-NO")}</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-3 text-sm">
              {selectedSubmission.team && <p><strong>Team:</strong> {selectedSubmission.team}</p>}
              {selectedSubmission.role && <p><strong>Rolle:</strong> {selectedSubmission.role}</p>}
              <p><strong>Verktøy:</strong> {(selectedSubmission.tools_used || []).join(", ") || "–"}</p>
              {selectedSubmission.tools_freetext && <p><strong>Fritekst:</strong> {selectedSubmission.tools_freetext}</p>}
              <p><strong>Modeller:</strong> {(selectedSubmission.models_used || []).join(", ") || "–"}</p>
              <p><strong>Bruksområder:</strong> {(selectedSubmission.use_cases || []).join(", ") || "–"}</p>
              <p><strong>Tid spart:</strong> {selectedSubmission.time_saved_range || "–"}</p>
              <p><strong>Sensitiv data:</strong> {selectedSubmission.data_sensitivity || "–"}</p>
              {selectedSubmission.pain_points && <p><strong>Utfordringer:</strong> {selectedSubmission.pain_points}</p>}
              {selectedSubmission.must_keep_tool && <p><strong>Må beholde:</strong> {selectedSubmission.must_keep_tool}</p>}
              <div className="flex justify-end pt-2">
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedSubmission.id)} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Slett innlevering
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

  const fetchAll = () => {
    Promise.all([
      supabase.from("evaluations").select("*").order("decided_at", { ascending: false }),
      supabase.from("tools").select("*").order("name"),
      supabase.from("models").select("*").order("name"),
    ]).then(([e, t, m]) => {
      setEvals(e.data || []);
      setTools(t.data || []);
      setModels(m.data || []);
    });
  };
  useEffect(() => { fetchAll(); }, []);

  const getName = (ev: any) => {
    if (ev.tool_id) return tools.find(t => t.id === ev.tool_id)?.name || "Ukjent verktøy";
    if (ev.model_id) return models.find(m => m.id === ev.model_id)?.name || "Ukjent modell";
    return "–";
  };

  const getType = (ev: any) => ev.tool_id ? "tool" : ev.model_id ? "model" : "unknown";

  const statusColors: Record<string, string> = {
    STANDARD: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    ALLOWED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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
    if (!entityId) { toast({ title: "Velg verktøy eller modell", variant: "destructive" }); return; }
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
        toast({ title: "Evaluering oppdatert" });
      } else {
        await adminAction({ action: "insert", table: "evaluations", payload });
        toast({ title: "Evaluering opprettet" });
      }
      resetForm();
      fetchAll();
    } catch (e: any) {
      toast({ title: "Feil", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminAction({ action: "delete", table: "evaluations", id });
      toast({ title: "Evaluering slettet" });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Feil", description: e.message, variant: "destructive" });
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
            <SelectItem value="all">Alle typer</SelectItem>
            <SelectItem value="tool"><span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Verktøy</span></SelectItem>
            <SelectItem value="model"><span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> Modeller</span></SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Alle statuser</SelectItem>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="ALLOWED">Tillatt</SelectItem>
            <SelectItem value="NOT_ALLOWED">Ikke tillatt</SelectItem>
            <SelectItem value="TRIAL">Prøveperiode</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} evalueringer</span>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Ny evaluering
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              {editingId ? <><Pencil className="h-4 w-4" /> Rediger evaluering</> : <><Plus className="h-4 w-4" /> Ny evaluering</>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={entityType} onValueChange={(v: any) => { setEntityType(v); setEntityId(""); }}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tool"><span className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> Verktøy</span></SelectItem>
                  <SelectItem value="model"><span className="flex items-center gap-1.5"><Brain className="h-3.5 w-3.5" /> Modell</span></SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger className="flex-1"><SelectValue placeholder={`Velg ${entityType === "tool" ? "verktøy" : "modell"}`} /></SelectTrigger>
                <SelectContent>
                  {entities.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD"><span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5" /> Standard</span></SelectItem>
                  <SelectItem value="ALLOWED"><span className="flex items-center gap-1.5"><CircleMinus className="h-3.5 w-3.5" /> Tillatt</span></SelectItem>
                  <SelectItem value="NOT_ALLOWED"><span className="flex items-center gap-1.5"><CircleX className="h-3.5 w-3.5" /> Ikke tillatt</span></SelectItem>
                  <SelectItem value="TRIAL"><span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Prøveperiode</span></SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Versjon (f.eks. v1)" value={version} onChange={e => setVersion(e.target.value)} className="w-[120px]" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Verdi (1-5)</Label>
                <Input type="number" min="1" max="5" placeholder="–" value={valueScore} onChange={e => setValueScore(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Risiko (1-5)</Label>
                <Input type="number" min="1" max="5" placeholder="–" value={riskScore} onChange={e => setRiskScore(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Kostnad (1-5)</Label>
                <Input type="number" min="1" max="5" placeholder="–" value={costScore} onChange={e => setCostScore(e.target.value)} />
              </div>
            </div>
            <Textarea placeholder="Begrunnelse / notater for beslutningen..." value={rationale} onChange={e => setRationale(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>Avbryt</Button>
              <Button size="sm" onClick={handleSave}>{editingId ? "Oppdater" : "Opprett"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 && <p className="text-muted-foreground">Ingen evalueringer funnet.</p>}
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
                    V:{ev.value_score || "–"} R:{ev.risk_score || "–"} K:{ev.cost_score || "–"}
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
                      <p className="text-xs text-muted-foreground">Verdi</p>
                      <p className="font-bold">{selectedItem.value_score || "–"}</p>
                    </div>
                    <div className="border rounded p-2">
                      <p className="text-xs text-muted-foreground">Risiko</p>
                      <p className="font-bold">{selectedItem.risk_score || "–"}</p>
                    </div>
                    <div className="border rounded p-2">
                      <p className="text-xs text-muted-foreground">Kostnad</p>
                      <p className="font-bold">{selectedItem.cost_score || "–"}</p>
                    </div>
                  </div>
                )}
                {selectedItem.rationale && <p><strong>Begrunnelse:</strong> {selectedItem.rationale}</p>}
                <p className="text-xs text-muted-foreground">Besluttet: {new Date(selectedItem.decided_at).toLocaleString("nb-NO")}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5"><History className="h-4 w-4" /> Evalueringshistorikk</h4>
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
                  <Pencil className="h-3.5 w-3.5" /> Rediger
                </Button>
                <Button variant="destructive" size="sm" onClick={() => { handleDelete(selectedItem.id); }} className="gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Slett
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



export default Admin;
