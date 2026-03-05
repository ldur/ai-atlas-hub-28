import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { Link2, ExternalLink, Pencil, Trash2 } from "lucide-react";

interface SharedLinkCardProps {
  link: any;
  isAdmin: boolean;
  onUpdated: () => void;
}

export function SharedLinkCard({ link, isAdmin, onUpdated }: SharedLinkCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [url, setUrl] = useState(link.url);
  const [title, setTitle] = useState(link.title || "");
  const [desc, setDesc] = useState(link.description || "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAction({
        action: "update",
        table: "shared_links",
        id: link.id,
        payload: { url: url.trim(), title: title.trim() || null, description: desc.trim() || null },
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
      await adminAction({ action: "delete", table: "shared_links", id: link.id });
      toast({ title: t("common.deleted") });
      onUpdated();
    } catch (e: any) {
      toast({ title: t("common.error"), description: e.message, variant: "destructive" });
    }
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <h3 className="font-medium truncate">{link.title || link.url}</h3>
              </div>
              {link.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>
              )}
              <p className="text-xs text-muted-foreground">{new Date(link.created_at).toLocaleDateString("nb-NO")}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setUrl(link.url); setTitle(link.title || ""); setDesc(link.description || ""); setEditOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteOpen(true)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="h-7 w-7">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL" maxLength={2000} />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("learning.link_title")} maxLength={200} />
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("learning.link_description")} rows={3} maxLength={1000} />
            <Button className="w-full" onClick={handleSave} disabled={saving || !url.trim()}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")} «{link.title || link.url}»?</AlertDialogTitle>
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
