import { memo } from "react";
import { 
  Smartphone, 
  Download, 
  Wifi, 
  WifiOff, 
  Share2, 
  CheckCircle, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import type { Translations } from "@/lib/i18n";

interface PWASectionProps {
  canInstall: boolean;
  isInstalled: boolean;
  isInstalling: boolean;
  install: () => void;
  showIOSInstructions: boolean;
  t: Translations;
}

export const PWASection = memo(function PWASection({
  canInstall,
  isInstalled,
  isInstalling,
  install,
  showIOSInstructions,
  t,
}: PWASectionProps) {
  return (
    <CollapsibleCard
      icon={<Smartphone className="w-5 h-5" />}
      title={t.settings.pwa.title}
      description={t.settings.pwa.description}
      testId="section-pwa"
    >
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <div>
            <span>{t.settings.pwa.installApp}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.pwa.installAppDesc}
            </p>
          </div>
        </Label>
        {isInstalled ? (
          <span className="text-xs text-green-500 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {t.settings.pwa.installed}
          </span>
        ) : canInstall ? (
          <Button
            variant="outline"
            size="sm"
            onClick={install}
            disabled={isInstalling}
            data-testid="button-install-pwa"
          >
            {isInstalling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>{t.common.on}</>
            )}
          </Button>
        ) : showIOSInstructions ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Share2 className="w-4 h-4" />
            Add to Home
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {t.settings.pwa.notInstalled}
          </span>
        )}
      </div>

      {showIOSInstructions && (
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          Tap <Share2 className="w-3 h-3 inline" /> then "Add to Home Screen"
        </p>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {navigator.onLine ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-500" />
          )}
          <div>
            <span>{t.settings.pwa.offlineMode}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.pwa.offlineModeDesc}
            </p>
          </div>
        </Label>
        <span className={`text-xs flex items-center gap-1 ${navigator.onLine ? 'text-green-500' : 'text-amber-500'}`}>
          {navigator.onLine ? t.camera.online : t.camera.offline}
        </span>
      </div>
    </CollapsibleCard>
  );
});
