import { memo } from "react";
import { Cloud, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UploadProgressOverlayProps {
  isVisible: boolean;
  completed: number;
  total: number;
  title?: string;
}

export const UploadProgressOverlay = memo(function UploadProgressOverlay({
  isVisible,
  completed,
  total,
  title = "Uploading to Cloud",
}: UploadProgressOverlayProps) {
  if (!isVisible) return null;
  
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      data-testid="upload-progress-overlay"
    >
      <Card className="w-80 p-6">
        <div className="flex flex-col items-center gap-4">
          <Cloud className="w-12 h-12 text-primary animate-pulse" />
          <div className="text-center">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {completed} of {total}
            </p>
          </div>
          <Progress value={percentage} className="w-full" />
        </div>
      </Card>
    </div>
  );
});

interface SingleUploadIndicatorProps {
  isUploading: boolean;
}

export const SingleUploadIndicator = memo(function SingleUploadIndicator({
  isUploading,
}: SingleUploadIndicatorProps) {
  if (!isUploading) return null;
  
  return (
    <div 
      className="flex items-center gap-2 text-sm text-muted-foreground"
      data-testid="upload-indicator"
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Uploading...</span>
    </div>
  );
});
