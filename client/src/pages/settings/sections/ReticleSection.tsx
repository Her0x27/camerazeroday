import { memo } from "react";
import { Crosshair, Eye, Palette } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useI18n } from "@/lib/i18n";
import type { Settings, ReticleConfig } from "@shared/schema";

interface ReticleSectionProps {
  settings: Settings;
  updateReticle: (updates: Partial<ReticleConfig>) => void;
}

export const ReticleSection = memo(function ReticleSection({
  settings,
  updateReticle,
}: ReticleSectionProps) {
  const { t } = useI18n();
  
  return (
    <CollapsibleCard
      icon={<Crosshair className="w-5 h-5" />}
      title={t.settings.crosshair.title}
      description={t.settings.crosshair.description}
      testId="section-reticle"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="reticle-enabled" className="flex items-center gap-2 cursor-pointer">
          <Eye className="w-4 h-4" />
          <div>
            <span>{t.settings.crosshair.showCrosshair}</span>
            <p className="text-xs text-muted-foreground font-normal">
              {t.settings.crosshair.showCrosshairDesc}
            </p>
          </div>
        </Label>
        <Switch
          id="reticle-enabled"
          checked={settings.reticle.enabled}
          onCheckedChange={(checked) => updateReticle({ enabled: checked })}
          data-testid="switch-reticle-enabled"
        />
      </div>

      {settings.reticle.enabled && (
        <>
          <Separator />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                {t.settings.crosshair.size}
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.reticle.size}%
              </span>
            </div>
            <Slider
              value={[settings.reticle.size]}
              onValueChange={([value]) => updateReticle({ size: value })}
              min={5}
              max={50}
              step={1}
              data-testid="slider-reticle-size"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Crosshair className="w-4 h-4" />
                {t.settings.crosshair.thickness}
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.reticle.strokeWidth || 3}%
              </span>
            </div>
            <Slider
              value={[settings.reticle.strokeWidth || 3]}
              onValueChange={([value]) => updateReticle({ strokeWidth: value })}
              min={1}
              max={10}
              step={1}
              data-testid="slider-stroke-width"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {t.settings.crosshair.opacity}
              </Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.reticle.opacity}%
              </span>
            </div>
            <Slider
              value={[settings.reticle.opacity]}
              onValueChange={([value]) => updateReticle({ opacity: value })}
              min={10}
              max={100}
              step={5}
              data-testid="slider-opacity"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-color" className="flex items-center gap-2 cursor-pointer">
              <Palette className="w-4 h-4" />
              <div>
                <span>{t.settings.crosshair.autoColor}</span>
                <p className="text-xs text-muted-foreground font-normal">
                  {t.settings.crosshair.autoColorDesc}
                </p>
              </div>
            </Label>
            <Switch
              id="auto-color"
              checked={settings.reticle.autoColor}
              onCheckedChange={(checked) => updateReticle({ autoColor: checked })}
              data-testid="switch-auto-color"
            />
          </div>
        </>
      )}
    </CollapsibleCard>
  );
});
