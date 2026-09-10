import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminAction } from "@/lib/adminAction";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Target, StickyNote } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ToolFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: any | null;
  onSaved: () => void;
  initialCatalogEntry?: any | null;
}

const catalogFields = [
  { key: "best_for", label: "Best for", icon: Target, rows: 3 },
] as const;

export const ToolFormDialog = ({ open, onOpenChange, tool, onSaved, initialCatalogEntry }: ToolFormDialogProps) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [vendor, setVendor] = useState("");
  const [link, setLink] = useState("");
  const [usageScope, setUsageScope] = useState("none");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [catalogEntryId, setCatalogEntryId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState({ best_for: "" });

  useEffect(() => {
    if (!open) return;
    if (tool) {
      setName(tool.name || "");
      setCategory(tool.category || "");
      setVendor(tool.vendor || "");
      setLink(tool.link || "");
      setUsageScope(tool.usage_scope || "none");
      setNotes(tool.notes || "");
      // Use pre-loaded catalog entry if available, otherwise fetch
      if (initialCatalogEntry !== undefined) {
        const data = initialCatalogEntry;
        setCatalogEntryId(data?.id || null);
        setCatalog({
          best_for: data?.best_for || "",
        });
      } else {
        supabase.from("catalog_entries").select("*").eq("tool_id", tool.id).maybeSingle().then(({ data, error }) => {
          if (error) { console.error("Failed to load catalog entry:", error); return; }
          setCatalogEntryId(data?.id || null);
          setCatalog({
            best_for: data?.best_for || "",
          });
        });
      }
    } else {
      setName(""); setCategory(""); setVendor(""); setLink(""); setUsageScope("none"); setNotes("");
      setCatalogEntryId(null);
      setCatalog({ best_for: "" });
    }
  }, [tool, open, initialCatalogEntry]);

  const handleGenerate = async () => {
    if (!name.trim()) { toast.error("Fyll inn navn først"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-info", {
        body: { name: name.trim(), type: "tool" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Replace previous content only when generation succeeded
      setCategory(data.category || "");
      setVendor(data.vendor || "");
      setLink(data.link || "");
      setCatalog({
        best_for: data.best_for || "",
      });
      if (data.uncertain) {
        toast.warning(data.uncertainty_note || "AI er usikker på dette verktøyet – verifiser innholdet mot leverandøren.");
      } else {
        toast.success("AI-generert innhold klart!");
      }
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
        category: category.trim() || null,
        vendor: vendor.trim() || null,
        link: link.trim() || null,
        usage_scope: usageScope === "none" ? null : usageScope,
        notes: notes.trim() || null,
      };

      let toolId = tool?.id;
      if (toolId) {
        await adminAction({ action: "update", table: "tools", id: toolId, payload });
      } else {
        const data = await adminAction({ action: "insert", table: "tools", payload });
        toolId = data.id;
      }

      // Save catalog entry if any content
      if (hasCatalogContent) {
        const catPayload = { ...catalog, tool_id: toolId, last_updated: new Date().toISOString() };
        if (catalogEntryId) {
          await adminAction({ action: "update", table: "catalog_entries", id: catalogEntryId, payload: catPayload });
        } else {
          await adminAction({ action: "insert", table: "catalog_entries", payload: catPayload });
        }
      } else if (catalogEntryId) {
        // Remove catalog entry if all fields cleared
        await adminAction({ action: "delete", table: "catalog_entries", id: catalogEntryId });
      }

      toast.success(tool ? "Verktøy oppdatert" : "Verktøy opprettet");
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
          <DialogTitle>{tool ? "Rediger verktøy" : "Nytt verktøy"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Navn *</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="F.eks. GitHub Copilot" className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating} className="gap-1.5 shrink-0">
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {generating ? "Genererer..." : "Fyll med AI"}
              </Button>
            </div>
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
            <Label className="text-xs">Bruksområde</Label>
            <Select value={usageScope} onValueChange={setUsageScope}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="none">Ikke satt</SelectItem>
                <SelectItem value="INTERNAL">Intern</SelectItem>
                <SelectItem value="CUSTOMER">Kunde</SelectItem>
                <SelectItem value="BOTH">Begge</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5"><StickyNote className="h-3 w-3" /> Notater</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Valgfrie notater..." />
          </div>

          <Separator />

          <Label className="text-sm font-semibold">Katalogoppføring</Label>

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
            {saving ? "Lagrer..." : tool ? "Oppdater" : "Opprett"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
