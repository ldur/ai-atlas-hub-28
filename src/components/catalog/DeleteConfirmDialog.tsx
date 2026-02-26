import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminAction } from "@/lib/adminAction";
import { toast } from "sonner";
import { useState } from "react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemId: string;
  table: "tools" | "models";
  onDeleted: () => void;
}

export const DeleteConfirmDialog = ({ open, onOpenChange, itemName, itemId, table, onDeleted }: DeleteConfirmDialogProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await adminAction({ action: "delete", table, id: itemId });
      toast.success(`${itemName} slettet`);
      onDeleted();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Kunne ikke slette");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Slett {itemName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Dette vil permanent slette «{itemName}» og kan ikke angres. Tilhørende evalueringer og katalogoppføringer vil også bli påvirket.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? "Sletter..." : "Slett"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
