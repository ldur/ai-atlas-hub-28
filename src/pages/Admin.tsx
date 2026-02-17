import { useState, useEffect } from "react";
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
      toast({ title: `✅ Ferdig! ${allResults.length} ${type === "tool" ? "verktøy" : "modeller"} generert.` });
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
        <CardTitle className="text-base">✨ Bulk AI-generering av katalogoppføringer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Generer kataloginnhold automatisk for alle verktøy og modeller som mangler oppføring.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => runBulk("tool")} disabled={running}>
            {running ? "⏳ Kjører..." : "🛠️ Generer for verktøy"}
          </Button>
          <Button size="sm" onClick={() => runBulk("model")} disabled={running}>
            {running ? "⏳ Kjører..." : "🧠 Generer for modeller"}
          </Button>
          <Button size="sm" variant="outline" onClick={runAll} disabled={running}>
            {running ? "⏳ Kjører..." : "✨ Generer for alle"}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2">
            {results.map((r, i) => (
              <div key={i} className="flex gap-2">
                <span>{r.type === "tool" ? "🛠️" : "🧠"}</span>
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
          <span className="text-5xl block">🔒</span>
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
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="submissions">Innleveringer</TabsTrigger>
          <TabsTrigger value="tools">Verktøy</TabsTrigger>
          <TabsTrigger value="evaluations">Evalueringer</TabsTrigger>
          <TabsTrigger value="catalog">Katalog</TabsTrigger>
          <TabsTrigger value="learning">Læring</TabsTrigger>
        </TabsList>
        <TabsContent value="submissions"><SubmissionsTab /></TabsContent>
        <TabsContent value="tools"><ToolsTab /></TabsContent>
        <TabsContent value="evaluations"><EvaluationsTab /></TabsContent>
        <TabsContent value="catalog"><CatalogTab /></TabsContent>
        <TabsContent value="learning"><LearningTab /></TabsContent>
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
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={submissions.length === 0}>
          📥 Eksporter CSV
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
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}>🗑️</Button>
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
                <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedSubmission.id)}>🗑️ Slett innlevering</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolsTab() {
  const [tools, setTools] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const { toast } = useToast();

  const fetch = () => supabase.from("tools").select("*").order("name").then(({ data }) => setTools(data || []));
  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("tools").insert({ name: name.trim(), category: category || null, vendor: vendor || null });
    if (error) toast({ title: "Feil", description: error.message, variant: "destructive" });
    else { setName(""); setCategory(""); setVendor(""); fetch(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("tools").delete().eq("id", id);
    fetch();
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-2">
        <Input placeholder="Navn" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Kategori" value={category} onChange={(e) => setCategory(e.target.value)} />
        <Input placeholder="Leverandør" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        <Button onClick={handleAdd}>➕</Button>
      </div>
      {tools.map((t) => (
        <div key={t.id} className="flex items-center justify-between border rounded-md p-3">
          <div>
            <span className="font-medium">{t.name}</span>
            {t.category && <Badge variant="secondary" className="ml-2">{t.category}</Badge>}
            {t.vendor && <span className="ml-2 text-sm text-muted-foreground">{t.vendor}</span>}
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>🗑️</Button>
        </div>
      ))}
    </div>
  );
}

function EvaluationsTab() {
  const [evals, setEvals] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [toolId, setToolId] = useState("");
  const [status, setStatus] = useState("ALLOWED");
  const [rationale, setRationale] = useState("");
  const { toast } = useToast();

  const fetch = () => {
    Promise.all([
      supabase.from("evaluations").select("*").order("decided_at", { ascending: false }),
      supabase.from("tools").select("*"),
    ]).then(([e, t]) => { setEvals(e.data || []); setTools(t.data || []); });
  };
  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!toolId) return;
    const { error } = await supabase.from("evaluations").insert({
      tool_id: toolId,
      decided_status: status,
      rationale: rationale || null,
    });
    if (error) toast({ title: "Feil", description: error.message, variant: "destructive" });
    else { setToolId(""); setRationale(""); fetch(); }
  };

  const getToolName = (id: string) => tools.find((t) => t.id === id)?.name || "Ukjent";

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select value={toolId} onValueChange={setToolId}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Velg verktøy" /></SelectTrigger>
          <SelectContent>{tools.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="ALLOWED">Tillatt</SelectItem>
            <SelectItem value="NOT_ALLOWED">Ikke tillatt</SelectItem>
            <SelectItem value="TRIAL">Prøveperiode</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd}>➕</Button>
      </div>
      <Textarea placeholder="Begrunnelse" value={rationale} onChange={(e) => setRationale(e.target.value)} />
      {evals.map((ev) => (
        <Card key={ev.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="font-medium">{ev.tool_id ? getToolName(ev.tool_id) : "–"}</span>
              <Badge className="ml-2" variant="outline">{ev.decided_status}</Badge>
              {ev.rationale && <p className="text-sm text-muted-foreground mt-1">{ev.rationale}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CatalogTab() {
  const [entries, setEntries] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [toolId, setToolId] = useState("");
  const [bestFor, setBestFor] = useState("");
  const [doThis, setDoThis] = useState("");
  const [avoidThis, setAvoidThis] = useState("");
  const [examplePrompts, setExamplePrompts] = useState("");
  const [securityGuidance, setSecurityGuidance] = useState("");
  const { toast } = useToast();

  const fetch = () => {
    Promise.all([
      supabase.from("catalog_entries").select("*"),
      supabase.from("tools").select("*"),
    ]).then(([c, t]) => { setEntries(c.data || []); setTools(t.data || []); });
  };
  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    const { error } = await supabase.from("catalog_entries").insert({
      tool_id: toolId || null,
      best_for: bestFor || null,
      do_this: doThis || null,
      avoid_this: avoidThis || null,
      example_prompts: examplePrompts || null,
      security_guidance: securityGuidance || null,
    });
    if (error) toast({ title: "Feil", description: error.message, variant: "destructive" });
    else { setBestFor(""); setDoThis(""); setAvoidThis(""); setExamplePrompts(""); setSecurityGuidance(""); fetch(); }
  };

  const getToolName = (id: string) => tools.find((t) => t.id === id)?.name || "Generelt";

  return (
    <div className="space-y-4 mt-4">
      <Select value={toolId} onValueChange={setToolId}>
        <SelectTrigger><SelectValue placeholder="Velg verktøy (valgfritt)" /></SelectTrigger>
        <SelectContent>{tools.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
      </Select>
      <Input placeholder="Best for" value={bestFor} onChange={(e) => setBestFor(e.target.value)} />
      <Textarea placeholder="Gjør dette" value={doThis} onChange={(e) => setDoThis(e.target.value)} />
      <Textarea placeholder="Unngå dette" value={avoidThis} onChange={(e) => setAvoidThis(e.target.value)} />
      <Textarea placeholder="Eksempelprompter (markdown)" value={examplePrompts} onChange={(e) => setExamplePrompts(e.target.value)} />
      <Textarea placeholder="Sikkerhetsveiledning" value={securityGuidance} onChange={(e) => setSecurityGuidance(e.target.value)} />
      <Button onClick={handleAdd}>➕ Legg til</Button>

      {entries.map((e) => (
        <Card key={e.id}>
          <CardContent className="p-4 text-sm">
            <p className="font-medium">{e.tool_id ? getToolName(e.tool_id) : "Generelt"}</p>
            {e.best_for && <p className="text-muted-foreground">{e.best_for}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LearningTab() {
  const [items, setItems] = useState<any[]>([]);
  const { toast } = useToast();

  const fetch = () => supabase.from("learning_items").select("*").order("created_at", { ascending: false }).then(({ data }) => setItems(data || []));
  useEffect(() => { fetch(); }, []);

  const togglePublish = async (id: string, published: boolean) => {
    await supabase.from("learning_items").update({ published: !published }).eq("id", id);
    fetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("learning_items").delete().eq("id", id);
    fetch();
  };

  return (
    <div className="space-y-3 mt-4">
      {items.length === 0 && <p className="text-muted-foreground">Ingen læringsinnhold ennå.</p>}
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.title}</span>
                <Badge variant={item.published ? "default" : "secondary"}>
                  {item.published ? "Publisert" : "Upublisert"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{item.type}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => togglePublish(item.id, item.published)}>
                {item.published ? "Avpubliser" : "Publiser"}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                🗑️
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default Admin;
