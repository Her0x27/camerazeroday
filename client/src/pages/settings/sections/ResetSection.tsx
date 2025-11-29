import { memo } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Translations } from "@/lib/i18n";

interface ResetSectionProps {
  onShowResetDialog: () => void;
  t: Translations;
}

export const ResetSection = memo(function ResetSection({
  onShowResetDialog,
  t,
}: ResetSectionProps) {
  return (
    <Card data-testid="section-reset">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw className="w-5 h-5 text-primary" />
          {t.settings.reset.title}
        </CardTitle>
        <CardDescription>
          {t.settings.reset.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          onClick={onShowResetDialog}
          data-testid="button-reset-settings"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          {t.settings.reset.resetAllSettings}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {t.settings.reset.photosNotAffected}
        </p>
      </CardContent>
    </Card>
  );
});
