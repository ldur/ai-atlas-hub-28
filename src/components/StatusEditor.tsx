import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statuses = [
  { value: "STANDARD", label: "🟢 Standard" },
  { value: "ALLOWED", label: "🟡 Tillatt ved behov" },
  { value: "NOT_ALLOWED", label: "🔴 Ikke tillatt" },
  { value: "TRIAL", label: "🧪 Prøveperiode" },
];

interface StatusEditorProps {
  evaluation: any | null;
  itemType: "tool" | "model";
  itemId: string;
  onSaved: (evaluation: any) => void;
}

export const StatusEditor = ({ evaluation, itemType, itemId, onSaved }: StatusEditorProps) => {
  const [status, setStatus] = useState(evaluation?.decided_status || "");
  const [rationale, setRationale] = useState(evaluation?.rationale || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!status) {
      toast.error("Velg en status");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        decided_status: status,
        rationale: rationale || null,
        decided_at: new Date().toISOString(),
        ...(itemType === "tool" ? { tool_id: itemId } : { model_id: itemId }),
      };

      if (evaluation?.id) {
        const { data, error } = await supabase
          .from("evaluations")
          .update(payload)
          .eq("id", evaluation.id)
          .select()
          .single();
        if (error) throw error;
        onSaved(data);
      } else {
        const { data, error } = await supabase
          .from("evaluations")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        onSaved(data);
      }
      toast.success("Klassifisering lagret!");
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke lagre");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4 bg-card">
      <h3 className="text-sm font-semibold">Klassifisering</h3>
      <div className="space-y-2">
        <Label className="text-xs">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Velg status..." />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Begrunnelse (valgfritt)</Label>
        <Textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={2}
          placeholder="Kort begrunnelse for valgt status..."
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving || !status}>
        {saving ? "⏳ Lagrer..." : "💾 Lagre klassifisering"}
      </Button>
    </div>
  );
};
