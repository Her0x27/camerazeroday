import { memo, useState, useCallback } from "react";
import { Link, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LinkItem {
  id: string;
  url: string;
  deleteUrl: string;
}

interface GalleryLinksDialogProps {
  open: boolean;
  links: LinkItem[];
  onOpenChange: (open: boolean) => void;
  onCopyAllLinks: () => void;
  t: {
    gallery: {
      cloudLinks: string;
      getLinks: string;
    };
    common: {
      error: string;
    };
  };
  toast: (props: { title: string; description: string; variant?: "destructive" }) => void;
}

export const GalleryLinksDialog = memo(function GalleryLinksDialog({
  open,
  links,
  onOpenChange,
  onCopyAllLinks,
  t,
  toast,
}: GalleryLinksDialogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = useCallback(async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: t.common.error,
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  }, [toast, t.common.error]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-5 h-5" />
            {t.gallery.cloudLinks} ({links.length})
          </DialogTitle>
          <DialogDescription>
            {t.gallery.getLinks}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto space-y-3 my-4">
          {links.map((item, index) => (
            <div 
              key={item.id}
              className="p-2 rounded-md bg-muted/50 space-y-1"
              data-testid={`link-item-${index}`}
            >
              <div 
                className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded p-1 group"
                onClick={() => handleCopyLink(item.url, item.id)}
              >
                <span className="text-xs text-muted-foreground w-12">Link:</span>
                <span className="flex-1 text-sm truncate font-mono">
                  {item.url}
                </span>
                {copiedId === item.id ? (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                )}
              </div>
              <div 
                className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded p-1 group"
                onClick={() => handleCopyLink(item.deleteUrl, `del-${item.id}`)}
              >
                <span className="text-xs text-destructive w-12">Delete:</span>
                <span className="flex-1 text-xs truncate font-mono text-muted-foreground">
                  {item.deleteUrl}
                </span>
                {copiedId === `del-${item.id}` ? (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-links"
          >
            Close
          </Button>
          <Button
            onClick={onCopyAllLinks}
            data-testid="button-copy-all-links"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
