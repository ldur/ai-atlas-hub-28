import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getAliasId, getNickname } from "@/lib/nickname";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight } from "lucide-react";

const DRAFT_KEY = "ai-tool-atlas-survey-draft";

const useCaseOptions = [
  { id: "koding", label: "Koding" },
  { id: "dokumentasjon", label: "Dokumentasjon" },
  { id: "analyse", label: "Analyse" },
  { id: "kundedialog", label: "Kundedialog" },
  { id: "design", label: "Design / Media" },
  { id: "automatisering", label: "Automatisering" },
];

const timeSavedOptions = [
  { value: "0", label: "0 timer" },
  { value: "1-2", label: "1–2 timer" },
  { value: "3-5", label: "3–5 timer" },
  { value: "5+", label: "5+ timer" },
];

const sensitivityOptions = [
  { value: "aldri", label: "Aldri" },
  { value: "usikker", label: "Usikker" },
  { value: "ja", label: "Ja" },
];

interface SurveyData {
  toolsUsed: string[];
  toolsFreetext: string;
  modelsUsed: string[];
  useCases: string[];
  timeSaved: string;
  dataSensitivity: string;
  painPoints: string;
  mustKeepTool: string;
}

const defaultData: SurveyData = {
  toolsUsed: [],
  toolsFreetext: "",
  modelsUsed: [],
  useCases: [],
  timeSaved: "",
  dataSensitivity: "",
  painPoints: "",
  mustKeepTool: "",
};

const Survey = () => {
  const [data, setData] = useState<SurveyData>(defaultData);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [knownTools, setKnownTools] = useState<string[]>([]);
  const [knownModels, setKnownModels] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch tools and models from database
    Promise.all([
      supabase.from("tools").select("name").order("name"),
      supabase.from("models").select("name").order("name"),
    ]).then(([toolsRes, modelsRes]) => {
      setKnownTools((toolsRes.data || []).map(t => t.name));
      setKnownModels([...(modelsRes.data || []).map(m => m.name), "Vet ikke"]);
    });
  }, []);

  useEffect(() => {
    if (!getAliasId()) {
      toast({ title: "Du må velge et kallenavn først", variant: "destructive" });
      navigate("/");
      return;
    }
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try { setData(JSON.parse(draft)); } catch { }
    }
  }, []);

  useEffect(() => {
    if (!submitted) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    }
  }, [data, submitted]);

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const handleSubmit = async () => {
    const aliasId = getAliasId();
    if (!aliasId) {
      toast({ title: "Du må velge et kallenavn først", variant: "destructive" });
      navigate("/");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("submissions").insert({
        alias_id: aliasId,
        tools_used: data.toolsUsed,
        tools_freetext: data.toolsFreetext || null,
        models_used: data.modelsUsed,
        use_cases: data.useCases,
        time_saved_range: data.timeSaved || null,
        data_sensitivity: data.dataSensitivity || null,
        pain_points: data.painPoints || null,
        must_keep_tool: data.mustKeepTool || null,
      });
      if (error) throw error;
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Feil ved innsending", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
        <h1 className="text-3xl font-bold">Takk for ditt bidrag!</h1>
        <p className="text-muted-foreground">Svarene dine er registrert anonymt.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/innsikt")} className="gap-1">
            Se innsikt <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/katalog")}>Utforsk katalogen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kartlegging</h1>
        <p className="text-muted-foreground">Del hvilke AI-verktøy og modeller du bruker (~5 min)</p>
      </div>

      {/* Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hvilke AI-verktøy bruker du?</CardTitle>
          <CardDescription>Velg fra listen og/eller skriv inn egne</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {knownTools.map((tool) => (
              <Badge
                key={tool}
                variant={data.toolsUsed.includes(tool) ? "default" : "outline"}
                className="cursor-pointer text-sm py-1 px-3"
                onClick={() => setData({ ...data, toolsUsed: toggleArray(data.toolsUsed, tool) })}
              >
                {tool}
              </Badge>
            ))}
          </div>
          <Input
            placeholder="Andre verktøy (kommaseparert)"
            value={data.toolsFreetext}
            onChange={(e) => setData({ ...data, toolsFreetext: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hvilke AI-modeller bruker du?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {knownModels.map((model) => (
              <Badge
                key={model}
                variant={data.modelsUsed.includes(model) ? "default" : "outline"}
                className="cursor-pointer text-sm py-1 px-3"
                onClick={() => setData({ ...data, modelsUsed: toggleArray(data.modelsUsed, model) })}
              >
                {model}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Use cases */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hva bruker du AI til?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {useCaseOptions.map((uc) => (
            <div key={uc.id} className="flex items-center gap-2">
              <Checkbox
                id={uc.id}
                checked={data.useCases.includes(uc.id)}
                onCheckedChange={() => setData({ ...data, useCases: toggleArray(data.useCases, uc.id) })}
              />
              <Label htmlFor={uc.id}>{uc.label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Time saved */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hvor mye tid sparer du per uke med AI?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={data.timeSaved} onValueChange={(v) => setData({ ...data, timeSaved: v })}>
            {timeSavedOptions.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`ts-${opt.value}`} />
                <Label htmlFor={`ts-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Data sensitivity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Har du lagt inn sensitiv/kundedata i AI-verktøy?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={data.dataSensitivity} onValueChange={(v) => setData({ ...data, dataSensitivity: v })}>
            {sensitivityOptions.map((opt) => (
              <div key={opt.value} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`ds-${opt.value}`} />
                <Label htmlFor={`ds-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Pain points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hva fungerer dårlig i dag?</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Beskriv utfordringer du møter med AI-verktøy..."
            value={data.painPoints}
            onChange={(e) => setData({ ...data, painPoints: e.target.value })}
            maxLength={1000}
          />
        </CardContent>
      </Card>

      {/* Must-keep tool */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Viktigste verktøy du ikke vil miste?</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="F.eks. GitHub Copilot"
            value={data.mustKeepTool}
            onChange={(e) => setData({ ...data, mustKeepTool: e.target.value })}
            maxLength={100}
          />
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
        {loading ? "Sender inn..." : "Send inn kartlegging"}
      </Button>
    </div>
  );
};

export default Survey;
