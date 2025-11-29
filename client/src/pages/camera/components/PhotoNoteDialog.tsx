import { memo } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";

interface PhotoNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export const PhotoNoteDialog = memo(function PhotoNoteDialog({
  open,
  onOpenChange,
  note,
  onNoteChange,
}: PhotoNoteDialogProps) {
  const { t } = useI18n();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {t.camera.addNote}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <Textarea
            placeholder={t.camera.enterNote}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            className="min-h-[100px] resize-none"
            data-testid="input-note"
            autoFocus
          />
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-close-note"
            >
              {t.common.done}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onNoteChange("")}
              data-testid="button-clear-note"
            >
              {t.common.clear}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
