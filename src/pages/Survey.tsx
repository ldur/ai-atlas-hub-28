import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getAliasId } from "@/lib/nickname";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { CheckCircle2, ArrowRight } from "lucide-react";

const DRAFT_KEY = "ai-tool-atlas-survey-draft";

interface SurveyData {
  toolsUsed: string[];
  toolsFreetext: string;
  modelsUsed: string[];
  useCases: string[];
  timeSaved: string;
  dataSensitivity: string;
  painPoints: string;
  mustKeepTool: string;
  customAnswers: Record<string, string>;
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
  customAnswers: {},
};

interface CustomQuestion {
  id: string;
  label: string;
}

interface SurveyRecord {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  enabled_questions: string[];
  custom_questions: CustomQuestion[];
}

const Survey = () => {
  const { surveyId } = useParams<{ surveyId?: string }>();
  const [data, setData] = useState<SurveyData>(defaultData);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [knownTools, setKnownTools] = useState<string[]>([]);
  const [knownModels, setKnownModels] = useState<string[]>([]);
  const [survey, setSurvey] = useState<SurveyRecord | null>(null);
  const [allSurveys, setAllSurveys] = useState<SurveyRecord[]>([]);
  const [surveyLoading, setSurveyLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useI18n();

  const useCaseOptions = [
    { id: "koding", labelKey: "usecase.coding" as const },
    { id: "dokumentasjon", labelKey: "usecase.documentation" as const },
    { id: "analyse", labelKey: "usecase.analysis" as const },
    { id: "kundedialog", labelKey: "usecase.customer_dialog" as const },
    { id: "design", labelKey: "usecase.design" as const },
    { id: "automatisering", labelKey: "usecase.automation" as const },
  ];

  const timeSavedOptions = [
    { value: "0", labelKey: "time.0" as const },
    { value: "1-2", labelKey: "time.1-2" as const },
    { value: "3-5", labelKey: "time.3-5" as const },
    { value: "5+", labelKey: "time.5+" as const },
  ];

  const sensitivityOptions = [
    { value: "aldri", labelKey: "sensitivity.never" as const },
    { value: "usikker", labelKey: "sensitivity.unsure" as const },
    { value: "ja", labelKey: "sensitivity.yes" as const },
  ];

  const isEnabled = (qId: string) => survey?.enabled_questions?.includes(qId) ?? true;

  useEffect(() => {
    setSurveyLoading(true);
    const loadSurvey = async () => {
      // Load all surveys for the selector
      const { data: allData } = await supabase.from("surveys").select("*").order("created_at");
      const allParsed = (allData || []).map((s: any) => ({
        ...s,
        enabled_questions: s.enabled_questions as any || [],
        custom_questions: s.custom_questions as any || [],
      })) as SurveyRecord[];
      setAllSurveys(allParsed);

      if (surveyId) {
        const found = allParsed.find(s => s.id === surveyId) || null;
        setSurvey(found);
      } else {
        const active = allParsed.find(s => s.is_active) || null;
        setSurvey(active);
      }
      setSurveyLoading(false);
    };
    loadSurvey();
  }, [surveyId]);

  useEffect(() => {
    Promise.all([
      supabase.from("tools").select("name").order("name"),
      supabase.from("models").select("name").order("name"),
    ]).then(([toolsRes, modelsRes]) => {
      setKnownTools((toolsRes.data || []).map(t => t.name));
      setKnownModels([...(modelsRes.data || []).map(m => m.name), t("survey.dont_know")]);
    });
  }, []);

  useEffect(() => {
    if (!getAliasId()) {
      toast({ title: t("survey.need_nickname"), variant: "destructive" });
      navigate("/");
      return;
    }
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try { setData({ ...defaultData, ...JSON.parse(draft) }); } catch { }
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
      toast({ title: t("survey.need_nickname"), variant: "destructive" });
      navigate("/");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("submissions").insert({
        alias_id: aliasId,
        survey_id: survey?.id || null,
        tools_used: isEnabled("tools") ? data.toolsUsed : [],
        tools_freetext: isEnabled("tools") ? (data.toolsFreetext || null) : null,
        models_used: isEnabled("models") ? data.modelsUsed : [],
        use_cases: isEnabled("use_cases") ? data.useCases : [],
        time_saved_range: isEnabled("time_saved") ? (data.timeSaved || null) : null,
        data_sensitivity: isEnabled("data_sensitivity") ? (data.dataSensitivity || null) : null,
        pain_points: isEnabled("pain_points") ? (data.painPoints || null) : null,
        must_keep_tool: isEnabled("must_keep") ? (data.mustKeepTool || null) : null,
        custom_answers: Object.keys(data.customAnswers).length > 0 ? data.customAnswers : null,
      });
      if (error) throw error;
      localStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: t("survey.submit_error"), description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (surveyLoading) {
    return <p className="text-muted-foreground text-center mt-12">{t("common.loading")}</p>;
  }

  if (!survey) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("surveys.not_found")}</h1>
        <Button variant="outline" onClick={() => navigate("/")}>{t("common.back")}</Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
        <h1 className="text-3xl font-bold">{t("survey.thanks")}</h1>
        <p className="text-muted-foreground">{t("survey.recorded")}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/innsikt")} className="gap-1">
            {t("survey.see_insights")} <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/katalog")}>{t("survey.explore_catalog")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{survey.title}</h1>
          <p className="text-muted-foreground">{survey.description || t("survey.subtitle")}</p>
        </div>
        {allSurveys.filter(s => s.is_active).length > 1 && (
          <Select
            value={survey.id}
            onValueChange={(id) => navigate(`/kartlegging/${id}`)}
          >
            <SelectTrigger className="w-[220px] shrink-0"><SelectValue /></SelectTrigger>
            <SelectContent>
              {allSurveys.filter(s => s.is_active).map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title} {s.is_active ? `(${t("surveys.active")})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isEnabled("tools") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("survey.which_tools")}</CardTitle>
            <CardDescription>{t("survey.select_or_write")}</CardDescription>
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
              placeholder={t("survey.other_tools")}
              value={data.toolsFreetext}
              onChange={(e) => setData({ ...data, toolsFreetext: e.target.value })}
            />
          </CardContent>
        </Card>
      )}

      {isEnabled("models") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("survey.which_models")}</CardTitle>
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
      )}

      {isEnabled("use_cases") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("survey.what_for")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {useCaseOptions.map((uc) => (
              <div key={uc.id} className="flex items-center gap-2">
                <Checkbox
                  id={uc.id}
                  checked={data.useCases.includes(uc.id)}
                  onCheckedChange={() => setData({ ...data, useCases: toggleArray(data.useCases, uc.id) })}
                />
                <Label htmlFor={uc.id}>{t(uc.labelKey)}</Label>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {isEnabled("time_saved") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("survey.time_saved")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={data.timeSaved} onValueChange={(v) => setData({ ...data, timeSaved: v })}>
              {timeSavedOptions.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`ts-${opt.value}`} />
                  <Label htmlFor={`ts-${opt.value}`}>{t(opt.labelKey)}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {isEnabled("data_sensitivity") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("survey.sensitive_data")}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={data.dataSensitivity} onValueChange={(v) => setData({ ...data, dataSensitivity: v })}>
              {sensitivityOptions.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`ds-${opt.value}`} />
                  <Label htmlFor={`ds-${opt.value}`}>{t(opt.labelKey)}</Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {isEnabled("pain_points") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("survey.pain_points")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={t("survey.pain_placeholder")}
              value={data.painPoints}
              onChange={(e) => setData({ ...data, painPoints: e.target.value })}
              maxLength={1000}
            />
          </CardContent>
        </Card>
      )}

      {isEnabled("must_keep") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("survey.must_keep")}</CardTitle>
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
      )}

      {/* Custom freetext questions */}
      {(survey.custom_questions || []).map((cq) => (
        <Card key={cq.id}>
          <CardHeader>
            <CardTitle className="text-lg">{cq.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={cq.label}
              value={data.customAnswers[cq.id] || ""}
              onChange={(e) => setData({ ...data, customAnswers: { ...data.customAnswers, [cq.id]: e.target.value } })}
              maxLength={1000}
            />
          </CardContent>
        </Card>
      ))}

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading}>
        {loading ? t("survey.submitting") : t("survey.submit_survey")}
      </Button>
    </div>
  );
};

export default Survey;
