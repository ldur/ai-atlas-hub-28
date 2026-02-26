import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminAction } from "@/lib/adminAction";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ToolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: any | null;
  onSaved: () => void;
}

export const ToolFormDialog = ({ open, onOpenChange, tool, onSaved }: ToolFormDialogProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tool) {
      setName(tool.name || "");
      setCategory(tool.category || "");
      setVendor(tool.vendor || "");
      setLink(tool.link || "");
      setNotes(tool.notes || "");
    } else {
      setName(""); setCategory(""); setVendor(""); setLink(""); setNotes("");
    }
  }, [tool, open]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Navn er påkrevd"); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim() || null,
        vendor: vendor.trim() || null,
        link: link.trim() || null,
        notes: notes.trim() || null,
      };
      if (tool?.id) {
        await adminAction({ action: "update", table: "tools", id: tool.id, payload });
        toast.success("Verktøy oppdatert");
      } else {
        await adminAction({ action: "insert", table: "tools", payload });
        toast.success("Verktøy opprettet");
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
          <DialogTitle>{tool ? "Rediger verktøy" : "Nytt verktøy"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Navn *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. GitHub Copilot" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Kategori</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="F.eks. Kodehjelp" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Leverandør</Label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="F.eks. Microsoft" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Lenke</Label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notater</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Valgfrie notater..." />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full gap-1.5">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Lagrer..." : tool ? "Oppdater" : "Opprett"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
