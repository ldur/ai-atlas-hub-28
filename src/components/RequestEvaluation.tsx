import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Inbox, Plus, Loader2, Brain, Wrench } from "lucide-react";

const REQUEST_VERSION = "request";

interface RequestRow {
  id: string;
  decided_at: string;
  notes: string | null;
  tool_id: string | null;
  model_id: string | null;
  name: string;
}

export function RequestEvaluation() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"tool" | "model">("tool");
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [link, setLink] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<RequestRow[]>([]);

  const loadRequests = useCallback(async () => {
    const [evalRes, toolRes, modelRes] = await Promise.all([
      supabase.from("evaluations").select("*").eq("version", REQUEST_VERSION).order("decided_at", { ascending: false }),
      supabase.from("tools").select("id,name,notes"),
      supabase.from("models").select("id,name,notes"),
    ]);
    const rows = (evalRes.data || []).map((e: any) => {
      const tool = e.tool_id ? toolRes.data?.find((x) => x.id === e.tool_id) : null;
      const model = e.model_id ? modelRes.data?.find((x) => x.id === e.model_id) : null;
      return {
        id: e.id,
        decided_at: e.decided_at,
        notes: (tool?.notes ?? model?.notes) || null,
        tool_id: e.tool_id,
        model_id: e.model_id,
        name: (tool?.name ?? model?.name) || t("common.unknown"),
      };
    });
    setRequests(rows);
  }, [t]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const reset = () => {
    setName("");
    setVendor("");
    setLink("");
    setReason("");
    setType("tool");
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      let toolId: string | null = null;
      let modelId: string | null = null;

      if (type === "tool") {
        const { data, error } = await supabase
          .from("tools")
          .insert({ name: name.trim(), vendor: vendor.trim() || null, link: link.trim() || null })
          .select("id")
          .single();
        if (error) throw error;
        toolId = data.id;
      } else {
        const { data, error } = await supabase
          .from("models")
          .insert({ name: name.trim(), provider: vendor.trim() || null, link: link.trim() || null })
          .select("id")
          .single();
        if (error) throw error;
        modelId = data.id;
      }

      const { error: evalError } = await supabase.from("evaluations").insert({
        tool_id: toolId,
        model_id: modelId,
        decided_status: "TRIAL",
        rationale: reason.trim() || null,
        version: REQUEST_VERSION,
      });
      if (evalError) throw evalError;

      toast.success(t("request.sent"));
      setOpen(false);
      reset();
      loadRequests();
    } catch (e: any) {
      toast.error(e?.message || t("request.error"));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === "no" ? "nb-NO" : "en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Inbox className="h-4 w-4" />
            <span className="hidden sm:inline">{t("request.list_title")}</span>
            {requests.length > 0 && <Badge variant="secondary">{requests.length}</Badge>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 bg-popover z-50 p-0">
          <div className="px-3 py-2 border-b text-sm font-semibold">{t("request.list_title")}</div>
          <div className="max-h-80 overflow-auto">
            {requests.length === 0 ? (
              <p className="p-3 text-sm text-muted-foreground">{t("request.empty")}</p>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="px-3 py-2 border-b last:border-b-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium flex items-center gap-1.5 min-w-0">
                      {r.tool_id ? <Wrench className="h-3.5 w-3.5 shrink-0" /> : <Brain className="h-3.5 w-3.5 shrink-0" />}
                      <span className="truncate">{r.name}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(r.decided_at)}</span>
                  </div>
                  {r.rationale && <p className="text-xs text-muted-foreground line-clamp-2">{r.rationale}</p>}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("request.button")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("request.title")}</DialogTitle>
            <DialogDescription>{t("request.desc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("request.type")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as "tool" | "model")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="tool">{t("request.tool")}</SelectItem>
                  <SelectItem value="model">{t("request.model")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("request.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("request.name_placeholder")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("request.vendor")}</Label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("request.link")}</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("request.reason")}</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </div>
            <Button className="w-full gap-1.5" onClick={handleSubmit} disabled={!name.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? t("common.saving") : t("request.submit")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
