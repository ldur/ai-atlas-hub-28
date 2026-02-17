import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminAction, isAdmin } from "@/lib/adminAction";
import { toast } from "sonner";

interface CatalogEntryEditorProps {
  entry: any | null;
  itemType: "tool" | "model";
  itemId: string;
  itemName: string;
  itemMeta?: { provider?: string; category?: string; modality?: string };
  onSaved: (entry: any) => void;
  onDeleted: () => void;
}

const fields = [
  { key: "best_for", label: "Best for", icon: "🎯" },
  { key: "example_prompts", label: "Eksempelprompter", icon: "💬" },
  { key: "do_this", label: "Gjør dette", icon: "✅" },
  { key: "avoid_this", label: "Unngå dette", icon: "❌" },
  { key: "security_guidance", label: "Sikkerhetsveiledning", icon: "🔒" },
] as const;

export const CatalogEntryEditor = ({
  entry,
  itemType,
  itemId,
  itemName,
  itemMeta,
  onSaved,
  onDeleted,
}: CatalogEntryEditorProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    best_for: entry?.best_for || "",
    example_prompts: entry?.example_prompts || "",
    do_this: entry?.do_this || "",
    avoid_this: entry?.avoid_this || "",
    security_guidance: entry?.security_guidance || "",
  });

  const admin = isAdmin();

  const handleGenerate = async () => {
    if (!admin) { toast.error("Kun admin kan gjøre endringer"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-catalog-info", {
        body: {
          name: itemName,
          type: itemType,
          provider: itemMeta?.provider,
          category: itemMeta?.category,
          modality: itemMeta?.modality,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setForm({
        best_for: data.best_for || "",
        example_prompts: data.example_prompts || "",
        do_this: data.do_this || "",
        avoid_this: data.avoid_this || "",
        security_guidance: data.security_guidance || "",
      });
      setEditing(true);
      toast.success("AI-generert innhold klart! Rediger og lagre.");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke generere innhold");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!admin) { toast.error("Kun admin kan gjøre endringer"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        ...(itemType === "tool" ? { tool_id: itemId } : { model_id: itemId }),
        last_updated: new Date().toISOString(),
      };

      if (entry?.id) {
        const data = await adminAction({ action: "update", table: "catalog_entries", id: entry.id, payload });
        onSaved(data);
      } else {
        const data = await adminAction({ action: "insert", table: "catalog_entries", payload });
        onSaved(data);
      }
      setEditing(false);
      toast.success("Katalogoppføring lagret!");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke lagre");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!admin) { toast.error("Kun admin kan gjøre endringer"); return; }
    if (!entry?.id) return;
    if (!confirm("Er du sikker på at du vil slette denne katalogoppføringen?")) return;
    try {
      await adminAction({ action: "delete", table: "catalog_entries", id: entry.id });
      onDeleted();
      toast.success("Katalogoppføring slettet");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke slette");
    }
  };

  if (!admin) return null;

  if (!editing && !entry) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 flex flex-col items-center gap-3">
          <p className="text-muted-foreground text-sm">Ingen katalogoppføring ennå</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              ✏️ Opprett manuelt
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? "⏳ Genererer..." : "✨ Generer med AI"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Katalogoppføring</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? "⏳" : "✨"} Regenerer med AI
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              ✏️ Rediger
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              🗑️ Slett
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {entry ? "Rediger katalogoppføring" : "Ny katalogoppføring"}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
              {generating ? "⏳ Genererer..." : "✨ Fyll med AI"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(({ key, label, icon }) => (
          <div key={key} className="space-y-1">
            <Label className="text-sm">
              {icon} {label}
            </Label>
            <Textarea
              value={form[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              rows={key === "example_prompts" ? 5 : 2}
              placeholder={`Skriv ${label.toLowerCase()}...`}
            />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "⏳ Lagrer..." : "💾 Lagre"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Avbryt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
