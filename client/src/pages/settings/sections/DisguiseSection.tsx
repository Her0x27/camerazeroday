import { memo } from "react";
import { Gamepad2, Eye, Hand, Clock3, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Translations } from "@/lib/i18n";

interface DisguiseSettings {
  enabled: boolean;
  gestureType: 'quickTaps' | 'patternUnlock';
  secretPattern: string;
  autoLockMinutes: number;
}

interface DisguiseSectionProps {
  disguiseSettings: DisguiseSettings;
  updateDisguiseSettings: (updates: Partial<DisguiseSettings>) => void;
  onShowPatternSetup: () => void;
  t: Translations;
}

export const DisguiseSection = memo(function DisguiseSection({
  disguiseSettings,
  updateDisguiseSettings,
  onShowPatternSetup,
  t,
}: DisguiseSectionProps) {
  return (
    <Card data-testid="section-disguise">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gamepad2 className="w-5 h-5 text-primary" />
          {t.settings.disguise.title}
        </CardTitle>
        <CardDescription>
          {t.settings.disguise.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="disguise-enabled" className="flex items-center gap-2 cursor-pointer">
            <Eye className="w-4 h-4" />
            <div>
              <span>{t.settings.disguise.enabled}</span>
              <p className="text-xs text-muted-foreground font-normal">
                {t.settings.disguise.enabledDesc}
              </p>
            </div>
          </Label>
          <Switch
            id="disguise-enabled"
            checked={disguiseSettings.enabled}
            onCheckedChange={(checked) => updateDisguiseSettings({ enabled: checked })}
            data-testid="switch-disguise-enabled"
          />
        </div>

        {disguiseSettings.enabled && (
          <>
            <Separator />

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Hand className="w-4 h-4" />
                {t.settings.disguise.secretGesture}
              </Label>
              <Select
                value={disguiseSettings.gestureType}
                onValueChange={(value) => updateDisguiseSettings({ gestureType: value as 'quickTaps' | 'patternUnlock' })}
              >
                <SelectTrigger data-testid="select-gesture-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quickTaps">{t.settings.disguise.quickTaps}</SelectItem>
                  <SelectItem value="patternUnlock">{t.settings.disguise.patternUnlock}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {disguiseSettings.gestureType === 'quickTaps' ? t.settings.disguise.quickTapsHint : t.settings.disguise.patternUnlockHint}
              </p>
            </div>

            {disguiseSettings.gestureType === 'patternUnlock' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    {disguiseSettings.secretPattern ? t.settings.disguise.changePattern : t.settings.disguise.setPattern}
                  </Label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onShowPatternSetup}
                    data-testid="button-set-pattern"
                  >
                    {disguiseSettings.secretPattern ? t.settings.disguise.changeSecretPattern : t.settings.disguise.setSecretPattern}
                  </Button>
                  {!disguiseSettings.secretPattern && (
                    <p className="text-xs text-amber-500">
                      {t.settings.disguise.patternNotSet}
                    </p>
                  )}
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  {t.settings.disguise.autoLock}
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {disguiseSettings.autoLockMinutes} {t.settings.disguise.min}
                </span>
              </div>
              <Slider
                value={[disguiseSettings.autoLockMinutes]}
                onValueChange={([value]) => updateDisguiseSettings({ autoLockMinutes: value })}
                min={1}
                max={30}
                step={1}
                data-testid="slider-auto-lock"
              />
              <p className="text-xs text-muted-foreground">
                {t.settings.disguise.autoLockDesc}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
});
