import { memo } from "react";
import { ImageIcon, Eye, Type } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useI18n } from "@/lib/i18n";
import type { Settings, ReticleConfig } from "@shared/schema";

interface WatermarkSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateReticle: (updates: Partial<ReticleConfig>) => void;
}

export const WatermarkSection = memo(function WatermarkSection({
  settings,
  updateSettings,
  updateReticle,
}: WatermarkSectionProps) {
  const { t } = useI18n();
  
  return (
    <CollapsibleCard
      icon={<ImageIcon className="w-5 h-5" />}
      title={t.settings.watermark.title}
      description={t.settings.watermark.description}
      testId="section-watermark"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="show-metadata" className="flex items-center gap-2 cursor-pointer">
          <Eye className="w-4 h-4" />
          <div>
            <span>{t.settings.watermark.showMetadata}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.watermark.showMetadataDesc}
            </p>
          </div>
        </Label>
        <Switch
          id="show-metadata"
          checked={settings.reticle.showMetadata}
          onCheckedChange={(checked) => updateReticle({ showMetadata: checked })}
          data-testid="switch-show-metadata"
        />
      </div>

      {settings.reticle.showMetadata && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                {t.settings.watermark.watermarkSize}
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.watermarkScale || 100}%
              </span>
            </div>
            <Slider
              value={[settings.watermarkScale || 100]}
              onValueChange={([value]) => updateSettings({ watermarkScale: value })}
              min={50}
              max={150}
              step={10}
              data-testid="slider-watermark-scale"
            />
            <p className="text-xs text-muted-foreground">
              {t.settings.watermark.watermarkSizeDesc}
            </p>
          </div>
        </>
      )}
    </CollapsibleCard>
  );
});
