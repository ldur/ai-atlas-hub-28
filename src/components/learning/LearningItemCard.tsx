import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminAction } from "@/lib/adminAction";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import ReactMarkdown from "react-markdown";
import { Pencil, Trash2 } from "lucide-react";
import MarkdownToolbar from "@/components/learning/MarkdownToolbar";

const typeKeys = ["tip", "show-tell", "prompt-pack", "guideline", "case-study"] as const;
const typeLabelMap: Record<string, string> = {
  tip: "learning.type.tip",
  "show-tell": "learning.type.show-tell",
  "prompt-pack": "learning.type.prompt-pack",
  guideline: "learning.type.guideline",
  "case-study": "learning.type.case-study",
};

interface LearningItemCardProps {
  item: any;
  isAdmin: boolean;
  onUpdated: () => void;
}

export function LearningItemCard({ item, isAdmin, onUpdated }: LearningItemCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content || "");
  const [type, setType] = useState(item.type);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAction({
        action: "update",
        table: "learning_items",
        id: item.id,
        payload: { title: title.trim(), content: content.trim(), type },
      });
      toast({ title: t("common.saved") });
      setEditOpen(false);
      onUpdated();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminAction({ action: "delete", table: "learning_items", id: item.id });
      toast({ title: t("common.deleted") });
      onUpdated();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <Badge variant="secondary">{t(typeLabelMap[item.type] as any) || item.type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{new Date(item.created_at).toLocaleDateString("nb-NO")}</p>
            </div>
            {isAdmin && (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setTitle(item.title); setContent(item.content || ""); setType(item.type); setEditOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-muted-foreground prose-a:text-primary prose-a:underline">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >{item.content || ""}</ReactMarkdown>
          </div>
          {item.tags?.length > 0 && (
            <div className="flex gap-1 mt-3">
              {item.tags.map((tag: string) => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {typeKeys.map((k) => <option key={k} value={k}>{t(typeLabelMap[k] as any)}</option>)}
            </select>
            <div className="space-y-1">
              <MarkdownToolbar textareaRef={contentRef} value={content} onChange={setContent} />
              <Textarea ref={contentRef} value={content} onChange={(e) => setContent(e.target.value)} rows={6} maxLength={5000} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")} «{item.title}»?</AlertDialogTitle>
            <AlertDialogDescription>{t("common.delete_confirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
