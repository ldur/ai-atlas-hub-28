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
import { getAdminToken, setAdminToken } from "@/lib/nickname";
import { useToast } from "@/hooks/use-toast";

const ADMIN_CODE = "atlas-admin-2024";

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
  useEffect(() => {
    supabase.from("submissions").select("*").order("created_at", { ascending: false }).then(({ data }) => setSubmissions(data || []));
  }, []);

  return (
    <div className="space-y-3 mt-4">
      {submissions.length === 0 && <p className="text-muted-foreground">Ingen innleveringer ennå.</p>}
      {submissions.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-4 text-sm space-y-1">
            <p><strong>Verktøy:</strong> {(s.tools_used || []).join(", ") || "–"} {s.tools_freetext && `+ ${s.tools_freetext}`}</p>
            <p><strong>Modeller:</strong> {(s.models_used || []).join(", ") || "–"}</p>
            <p><strong>Bruksområder:</strong> {(s.use_cases || []).join(", ") || "–"}</p>
            <p><strong>Tid spart:</strong> {s.time_saved_range || "–"}</p>
            <p><strong>Sensitiv data:</strong> {s.data_sensitivity || "–"}</p>
            {s.pain_points && <p><strong>Utfordringer:</strong> {s.pain_points}</p>}
            {s.must_keep_tool && <p><strong>Må beholde:</strong> {s.must_keep_tool}</p>}
            <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("nb-NO")}</p>
          </CardContent>
        </Card>
      ))}
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
