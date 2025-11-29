import { memo } from "react";
import { Database, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBytes } from "@/lib/date-utils";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
  
  return (
    <Card data-testid="section-storage">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="w-5 h-5 text-primary" />
          {t.settings.storage.title}
        </CardTitle>
        <CardDescription>
          {t.settings.storage.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {storageInfo && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.settings.storage.photosStored}</span>
              <span className="font-medium">{storageInfo.photos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.settings.storage.storageUsed}</span>
              <span className="font-medium">{formatBytes(storageInfo.used)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.settings.storage.available}</span>
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
          {t.settings.storage.clearAllPhotos}
        </Button>
      </CardContent>
    </Card>
  );
});
