import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminAction } from "@/lib/adminAction";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Target, MessageSquare, CheckCircle2, XCircle, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ModelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model?: any | null;
  onSaved: () => void;
}

const catalogFields = [
  { key: "best_for", label: "Best for", icon: Target, rows: 2 },
  { key: "example_prompts", label: "Eksempelprompter", icon: MessageSquare, rows: 4 },
  { key: "do_this", label: "Gjør dette", icon: CheckCircle2, rows: 2 },
  { key: "avoid_this", label: "Unngå dette", icon: XCircle, rows: 2 },
  { key: "security_guidance", label: "Sikkerhetsveiledning", icon: Shield, rows: 2 },
] as const;

export const ModelFormDialog = ({ open, onOpenChange, model, onSaved }: ModelFormDialogProps) => {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [modality, setModality] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [catalogEntryId, setCatalogEntryId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState({
    best_for: "",
    example_prompts: "",
    do_this: "",
    avoid_this: "",
    security_guidance: "",
  });

  useEffect(() => {
    if (!open) return;
    if (model) {
      setName(model.name || "");
      setProvider(model.provider || "");
      setModality(model.modality || "");
      setNotes(model.notes || "");
      supabase.from("catalog_entries").select("*").eq("model_id", model.id).maybeSingle().then(({ data }) => {
        setCatalogEntryId(data?.id || null);
        setCatalog({
          best_for: data?.best_for || "",
          example_prompts: data?.example_prompts || "",
          do_this: data?.do_this || "",
          avoid_this: data?.avoid_this || "",
          security_guidance: data?.security_guidance || "",
        });
      });
    } else {
      setName(""); setProvider(""); setModality(""); setNotes("");
      setCatalogEntryId(null);
      setCatalog({ best_for: "", example_prompts: "", do_this: "", avoid_this: "", security_guidance: "" });
    }
  }, [model, open]);

  const handleGenerate = async () => {
    if (!name.trim()) { toast.error("Fyll inn navn først"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-info", {
        body: { name: name.trim(), type: "model", provider: provider.trim(), modality: modality.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCatalog({
        best_for: data.best_for || "",
        example_prompts: data.example_prompts || "",
        do_this: data.do_this || "",
        avoid_this: data.avoid_this || "",
        security_guidance: data.security_guidance || "",
      });
      toast.success("AI-generert innhold klart!");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke generere innhold");
    } finally {
      setGenerating(false);
    }
  };

  const hasCatalogContent = Object.values(catalog).some((v) => v.trim());

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Navn er påkrevd"); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        provider: provider.trim() || null,
        modality: modality.trim() || null,
        notes: notes.trim() || null,
      };

      let modelId = model?.id;
      if (modelId) {
        await adminAction({ action: "update", table: "models", id: modelId, payload });
      } else {
        const data = await adminAction({ action: "insert", table: "models", payload });
        modelId = data.id;
      }

      if (hasCatalogContent) {
        const catPayload = { ...catalog, model_id: modelId, last_updated: new Date().toISOString() };
        if (catalogEntryId) {
          await adminAction({ action: "update", table: "catalog_entries", id: catalogEntryId, payload: catPayload });
        } else {
          await adminAction({ action: "insert", table: "catalog_entries", payload: catPayload });
        }
      } else if (catalogEntryId) {
        await adminAction({ action: "delete", table: "catalog_entries", id: catalogEntryId });
      }

      toast.success(model ? "Modell oppdatert" : "Modell opprettet");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke lagre");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{model ? "Rediger modell" : "Ny modell"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Navn *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. GPT-4o" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Leverandør</Label>
              <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="F.eks. OpenAI" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Modalitet</Label>
              <Input value={modality} onChange={(e) => setModality(e.target.value)} placeholder="F.eks. Tekst, Bilde" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notater</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Valgfrie notater..." />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Katalogoppføring</Label>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5">
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {generating ? "Genererer..." : "Fyll med AI"}
            </Button>
          </div>

          {catalogFields.map(({ key, label, icon: Icon, rows }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs flex items-center gap-1.5">
                <Icon className="h-3 w-3" /> {label}
              </Label>
              <Textarea
                value={catalog[key]}
                onChange={(e) => setCatalog((prev) => ({ ...prev, [key]: e.target.value }))}
                rows={rows}
                placeholder={`Skriv ${label.toLowerCase()}...`}
              />
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Lagrer..." : model ? "Oppdater" : "Opprett"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
