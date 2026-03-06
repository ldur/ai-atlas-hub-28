import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { adminAction } from "@/lib/adminAction";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Plus, Pencil, Trash2, ClipboardList, X } from "lucide-react";

const ALL_QUESTION_IDS = ["tools", "models", "use_cases", "time_saved", "data_sensitivity", "pain_points", "must_keep"] as const;

interface CustomQuestion {
  id: string;
  label: string;
}

interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  enabled_questions: string[];
  custom_questions: CustomQuestion[];
  submission_count?: number;
}

const QUESTION_LABELS: Record<string, { no: string; en: string }> = {
  tools: { no: "Hvilke AI-verktøy bruker du?", en: "Which AI tools do you use?" },
  models: { no: "Hvilke AI-modeller bruker du?", en: "Which AI models do you use?" },
  use_cases: { no: "Hva bruker du AI til?", en: "What do you use AI for?" },
  time_saved: { no: "Tid spart per uke", en: "Time saved per week" },
  data_sensitivity: { no: "Sensitiv data i AI-verktøy?", en: "Sensitive data in AI tools?" },
  pain_points: { no: "Utfordringer", en: "Pain points" },
  must_keep: { no: "Viktigste verktøy", en: "Most important tool" },
};

export function SurveysTab() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enabledQuestions, setEnabledQuestions] = useState<string[]>([...ALL_QUESTION_IDS]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const { toast } = useToast();
  const { t, lang } = useI18n();

  const fetchSurveys = async () => {
    const { data: surveysData } = await supabase.from("surveys").select("*").order("created_at", { ascending: false });
    const { data: submissions } = await supabase.from("submissions").select("survey_id");

    const countMap: Record<string, number> = {};
    (submissions || []).forEach((s: any) => {
      if (s.survey_id) countMap[s.survey_id] = (countMap[s.survey_id] || 0) + 1;
    });

    setSurveys((surveysData || []).map((s: any) => ({
      ...s,
      enabled_questions: s.enabled_questions || [...ALL_QUESTION_IDS],
      custom_questions: s.custom_questions || [],
      submission_count: countMap[s.id] || 0,
    })));
  };

  useEffect(() => { fetchSurveys(); }, []);

  const openCreate = () => {
    setEditingSurvey(null);
    setTitle("");
    setDescription("");
    setEnabledQuestions([...ALL_QUESTION_IDS]);
    setCustomQuestions([]);
    setNewCustomLabel("");
    setDialogOpen(true);
  };

  const openEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setTitle(survey.title);
    setDescription(survey.description || "");
    setEnabledQuestions(survey.enabled_questions);
    setCustomQuestions(survey.custom_questions);
    setNewCustomLabel("");
    setDialogOpen(true);
  };

  const toggleQuestion = (qId: string) => {
    setEnabledQuestions(prev =>
      prev.includes(qId) ? prev.filter(q => q !== qId) : [...prev, qId]
    );
  };

  const addCustomQuestion = () => {
    if (!newCustomLabel.trim()) return;
    setCustomQuestions(prev => [...prev, { id: `custom_${Date.now()}`, label: newCustomLabel.trim() }]);
    setNewCustomLabel("");
  };

  const removeCustomQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        enabled_questions: enabledQuestions,
        custom_questions: customQuestions,
        updated_at: new Date().toISOString(),
      };

      if (editingSurvey) {
        await adminAction({ action: "update", table: "surveys", id: editingSurvey.id, payload });
        toast({ title: t("surveys.updated") });
      } else {
        await adminAction({
          action: "insert",
          table: "surveys",
          payload: { ...payload, is_active: false },
        });
        toast({ title: t("surveys.created") });
      }
      setDialogOpen(false);
      fetchSurveys();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const handleToggleActive = async (survey: Survey) => {
    try {
      await adminAction({
        action: "update",
        table: "surveys",
        id: survey.id,
        payload: { is_active: !survey.is_active, updated_at: new Date().toISOString() },
      });
      toast({ title: t("surveys.updated") });
      fetchSurveys();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("surveys.delete_confirm"))) return;
    try {
      await adminAction({ action: "delete", table: "surveys", id });
      toast({ title: t("surveys.deleted") });
      fetchSurveys();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{surveys.length} {t("surveys.title").toLowerCase()}</span>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> {t("surveys.create")}
        </Button>
      </div>

      {surveys.length === 0 && <p className="text-muted-foreground">{t("surveys.no_surveys")}</p>}

      {surveys.map((survey) => (
        <Card key={survey.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{survey.title}</span>
                  <Badge variant={survey.is_active ? "default" : "secondary"}>
                    {survey.is_active ? t("surveys.active") : t("surveys.inactive")}
                  </Badge>
                </div>
                {survey.description && (
                  <p className="text-sm text-muted-foreground">{survey.description}</p>
                )}
                <div className="flex gap-1 flex-wrap">
                  {survey.enabled_questions.map(q => (
                    <Badge key={q} variant="outline" className="text-xs">{QUESTION_LABELS[q]?.[lang] || q}</Badge>
                  ))}
                  {survey.custom_questions.map(q => (
                    <Badge key={q.id} variant="outline" className="text-xs bg-accent/30">{q.label}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {survey.submission_count} {t("surveys.submissions_count")} · {new Date(survey.created_at).toLocaleDateString("nb-NO")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center gap-2 mr-2">
                  <Switch checked={survey.is_active} onCheckedChange={() => handleToggleActive(survey)} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => openEdit(survey)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(survey.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSurvey ? t("surveys.edit") : t("surveys.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("surveys.name")}</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("surveys.name")} />
            </div>
            <div>
              <Label>{t("surveys.description")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("surveys.description")} rows={2} />
            </div>

            <Separator />

            {/* Standard questions toggle */}
            <div>
              <Label className="text-sm font-semibold">{t("surveys.standard_questions")}</Label>
              <div className="space-y-2 mt-2">
                {ALL_QUESTION_IDS.map(qId => (
                  <div key={qId} className="flex items-center gap-2">
                    <Checkbox
                      id={`q-${qId}`}
                      checked={enabledQuestions.includes(qId)}
                      onCheckedChange={() => toggleQuestion(qId)}
                    />
                    <Label htmlFor={`q-${qId}`} className="text-sm font-normal">
                      {QUESTION_LABELS[qId]?.[lang] || qId}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Custom questions */}
            <div>
              <Label className="text-sm font-semibold">{t("surveys.custom_questions")}</Label>
              <div className="space-y-2 mt-2">
                {customQuestions.map(q => (
                  <div key={q.id} className="flex items-center gap-2">
                    <span className="text-sm flex-1">{q.label}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCustomQuestion(q.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newCustomLabel}
                    onChange={e => setNewCustomLabel(e.target.value)}
                    placeholder={t("surveys.custom_question_placeholder")}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomQuestion())}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={addCustomQuestion} disabled={!newCustomLabel.trim()}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSave} disabled={!title.trim()}>
                {editingSurvey ? t("common.save") : t("common.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
