import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminAction } from "@/lib/adminAction";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ModelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model?: any | null;
  onSaved: () => void;
}

export const ModelFormDialog = ({ open, onOpenChange, model, onSaved }: ModelFormDialogProps) => {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [modality, setModality] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (model) {
      setName(model.name || "");
      setProvider(model.provider || "");
      setModality(model.modality || "");
      setNotes(model.notes || "");
    } else {
      setName(""); setProvider(""); setModality(""); setNotes("");
    }
  }, [model, open]);

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
      if (model?.id) {
        await adminAction({ action: "update", table: "models", id: model.id, payload });
        toast.success("Modell oppdatert");
      } else {
        await adminAction({ action: "insert", table: "models", payload });
        toast.success("Modell opprettet");
      }
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
      <DialogContent className="sm:max-w-md">
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
          <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Lagrer..." : model ? "Oppdater" : "Opprett"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
