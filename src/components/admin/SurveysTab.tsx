import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminAction } from "@/lib/adminAction";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { Plus, Pencil, Trash2, ClipboardList } from "lucide-react";

interface Survey {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  submission_count?: number;
}

export function SurveysTab() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchSurveys = async () => {
    const { data: surveysData } = await supabase.from("surveys").select("*").order("created_at", { ascending: false });
    const { data: submissions } = await supabase.from("submissions").select("survey_id");

    const countMap: Record<string, number> = {};
    (submissions || []).forEach((s: any) => {
      if (s.survey_id) countMap[s.survey_id] = (countMap[s.survey_id] || 0) + 1;
    });

    setSurveys((surveysData || []).map((s: any) => ({
      ...s,
      submission_count: countMap[s.id] || 0,
    })));
  };

  useEffect(() => { fetchSurveys(); }, []);

  const openCreate = () => {
    setEditingSurvey(null);
    setTitle("");
    setDescription("");
    setDialogOpen(true);
  };

  const openEdit = (survey: Survey) => {
    setEditingSurvey(survey);
    setTitle(survey.title);
    setDescription(survey.description || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    try {
      if (editingSurvey) {
        await adminAction({
          action: "update",
          table: "surveys",
          id: editingSurvey.id,
          payload: { title: title.trim(), description: description.trim() || null, updated_at: new Date().toISOString() },
        });
        toast({ title: t("surveys.updated") });
      } else {
        await adminAction({
          action: "insert",
          table: "surveys",
          payload: { title: title.trim(), description: description.trim() || null, is_active: false },
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
                <p className="text-xs text-muted-foreground">
                  {survey.submission_count} {t("surveys.submissions_count")} · {new Date(survey.created_at).toLocaleDateString("nb-NO")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center gap-2 mr-2">
                  <Switch
                    checked={survey.is_active}
                    onCheckedChange={() => handleToggleActive(survey)}
                  />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSurvey ? t("surveys.edit") : t("surveys.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("surveys.name")}</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("surveys.name")} />
            </div>
            <div>
              <Label>{t("surveys.description")}</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t("surveys.description")} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
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
