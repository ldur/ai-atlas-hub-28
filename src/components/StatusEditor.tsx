import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminAction, isAdmin } from "@/lib/adminAction";
import { toast } from "sonner";
import { CircleCheck, CircleMinus, CircleX, FlaskConical, Save, Loader2 } from "lucide-react";

const statuses = [
  { value: "ALLOWED", label: "Tillatt", icon: CircleCheck },
  { value: "NOT_ALLOWED", label: "Ikke tillatt", icon: CircleX },
  { value: "TRIAL", label: "Prøveperiode", icon: FlaskConical },
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

  if (!isAdmin()) return null;

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
        const data = await adminAction({ action: "update", table: "evaluations", id: evaluation.id, payload });
        onSaved(data);
      } else {
        const data = await adminAction({ action: "insert", table: "evaluations", payload });
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
            {statuses.map((s) => {
              const Icon = s.icon;
              return (
                <SelectItem key={s.value} value={s.value}>
                  <span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /> {s.label}</span>
                </SelectItem>
              );
            })}
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
      <Button size="sm" onClick={handleSave} disabled={saving || !status} className="gap-1.5">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Lagrer..." : "Lagre klassifisering"}
      </Button>
    </div>
  );
};
