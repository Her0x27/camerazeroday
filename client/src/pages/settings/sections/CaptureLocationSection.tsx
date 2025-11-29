import { memo } from "react";
import { Camera, MapPin, Target, Compass } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useI18n } from "@/lib/i18n";
import type { Settings } from "@shared/schema";

interface CaptureLocationSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

export const CaptureLocationSection = memo(function CaptureLocationSection({
  settings,
  updateSettings,
}: CaptureLocationSectionProps) {
  const { t } = useI18n();
  
  return (
    <CollapsibleCard
      icon={<Camera className="w-5 h-5" />}
      title={t.settings.capture.title}
      description={t.settings.capture.description}
      testId="section-capture-location"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="gps-enabled" className="flex items-center gap-2 cursor-pointer">
          <MapPin className="w-4 h-4" />
          <div>
            <span>{t.settings.capture.gpsLocation}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.capture.gpsLocationDesc}
            </p>
          </div>
        </Label>
        <Switch
          id="gps-enabled"
          checked={settings.gpsEnabled}
          onCheckedChange={(checked) => updateSettings({ gpsEnabled: checked })}
          data-testid="switch-gps"
        />
      </div>

      {settings.gpsEnabled && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                {t.settings.capture.accuracyLimit}
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.accuracyLimit || 20}m
              </span>
            </div>
            <Slider
              value={[settings.accuracyLimit || 20]}
              onValueChange={([value]) => updateSettings({ accuracyLimit: value })}
              min={5}
              max={100}
              step={5}
              data-testid="slider-accuracy-limit"
            />
            <p className="text-xs text-muted-foreground">
              {t.settings.capture.accuracyLimitDesc}
            </p>
          </div>
        </>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="orientation-enabled" className="flex items-center gap-2 cursor-pointer">
          <Compass className="w-4 h-4" />
          <div>
            <span>{t.settings.capture.compassOrientation}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.capture.compassOrientationDesc}
            </p>
          </div>
        </Label>
        <Switch
          id="orientation-enabled"
          checked={settings.orientationEnabled}
          onCheckedChange={(checked) => updateSettings({ orientationEnabled: checked })}
          data-testid="switch-orientation"
        />
      </div>
    </CollapsibleCard>
  );
});
