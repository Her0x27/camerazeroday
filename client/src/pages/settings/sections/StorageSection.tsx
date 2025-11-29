import { memo } from "react";
import { Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBytes } from "@/lib/date-utils";

interface StorageInfo {
  photos: number;
  used: number;
  quota: number;
}

interface StorageSectionProps {
  storageInfo: StorageInfo | null;
  onShowClearDialog: () => void;
}

export const StorageSection = memo(function StorageSection({
  storageInfo,
  onShowClearDialog,
}: StorageSectionProps) {
  return (
    <Card data-testid="section-storage">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-5 h-5 text-primary" />
          Storage
        </CardTitle>
        <CardDescription>
          Locally stored photos on your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {storageInfo && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Photos stored</span>
              <span className="font-medium">{storageInfo.photos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage used</span>
              <span className="font-medium">{formatBytes(storageInfo.used)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium">{formatBytes(storageInfo.quota - storageInfo.used)}</span>
            </div>
            
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-primary transition-all"
                style={{ 
                  width: `${Math.min((storageInfo.used / storageInfo.quota) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        <Separator />

        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={onShowClearDialog}
          disabled={!storageInfo || storageInfo.photos === 0}
          data-testid="button-clear-storage"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Photos
        </Button>
      </CardContent>
    </Card>
  );
});
