import { memo } from "react";
import { 
  Settings2, 
  Languages, 
  Volume2, 
  VolumeX 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Settings } from "@shared/schema";
import type { Translations } from "@/lib/i18n";

interface LanguageOption {
  code: string;
  nativeName: string;
}

interface GeneralSettingsSectionProps {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  language: string;
  setLanguage: (lang: "en" | "ru") => void;
  availableLanguages: LanguageOption[];
  t: Translations;
}

export const GeneralSettingsSection = memo(function GeneralSettingsSection({
  settings,
  updateSettings,
  language,
  setLanguage,
  availableLanguages,
  t,
}: GeneralSettingsSectionProps) {
  return (
    <Card data-testid="section-general-settings">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings2 className="w-5 h-5 text-primary" />
          {t.settings.general.title}
        </CardTitle>
        <CardDescription>
          {t.settings.general.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Label className="flex items-center gap-2">
            <Languages className="w-4 h-4" />
            <div>
              <span>{t.settings.general.language}</span>
              <p className="text-xs text-muted-foreground font-normal">
                {t.settings.general.languageDesc}
              </p>
            </div>
          </Label>
          <Select
            value={language}
            onValueChange={(val) => setLanguage(val as "en" | "ru")}
          >
            <SelectTrigger className="w-32" data-testid="select-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.nativeName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled" className="flex items-center gap-2 cursor-pointer">
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <div>
              <span>{t.settings.general.captureSound}</span>
              <p className="text-xs text-muted-foreground font-normal">
                {t.settings.general.captureSoundDesc}
              </p>
            </div>
          </Label>
          <Switch
            id="sound-enabled"
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            data-testid="switch-sound"
          />
        </div>
      </CardContent>
    </Card>
  );
});
