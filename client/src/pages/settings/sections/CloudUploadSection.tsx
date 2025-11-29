import { memo } from "react";
import { 
  Cloud, 
  Key, 
  Clock, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import type { Settings, ImgbbSettings } from "@shared/schema";
import type { Translations } from "@/lib/i18n";

interface CloudUploadSectionProps {
  settings: Settings;
  apiKeyInput: string;
  onApiKeyChange: (value: string) => void;
  isValidating: boolean;
  validationError: string | null;
  onValidateApiKey: () => void;
  onImgbbUpdate: (updates: Partial<ImgbbSettings>) => void;
  t: Translations;
}

export const CloudUploadSection = memo(function CloudUploadSection({
  settings,
  apiKeyInput,
  onApiKeyChange,
  isValidating,
  validationError,
  onValidateApiKey,
  onImgbbUpdate,
  t,
}: CloudUploadSectionProps) {
  return (
    <Card data-testid="section-cloud-upload">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="w-5 h-5 text-primary" />
          {t.settings.cloud.title}
        </CardTitle>
        <CardDescription>
          {t.settings.cloud.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            {t.settings.cloud.apiToken}
          </Label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder={t.settings.cloud.enterApiKey}
              value={apiKeyInput}
              onChange={(e) => onApiKeyChange(e.target.value)}
              data-testid="input-imgbb-api-key"
            />
            <Button
              variant="outline"
              onClick={onValidateApiKey}
              disabled={isValidating || !apiKeyInput.trim()}
              data-testid="button-validate-api-key"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : settings.imgbb?.isValidated ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                t.settings.cloud.validate
              )}
            </Button>
          </div>
          {validationError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {validationError}
            </p>
          )}
          {settings.imgbb?.isValidated && !validationError && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {t.settings.cloud.apiKeyValidated}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {t.settings.cloud.getApiKey}{" "}
            <a 
              href="https://api.imgbb.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              api.imgbb.com
            </a>
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t.settings.cloud.photoExpiration}
            </Label>
            <span className="text-sm text-muted-foreground font-mono">
              {(settings.imgbb?.expiration || 0) === 0 
                ? t.common.never 
                : `${settings.imgbb?.expiration} ${t.common.seconds}`}
            </span>
          </div>
          <Slider
            value={[settings.imgbb?.expiration || 0]}
            onValueChange={([value]) => onImgbbUpdate({ expiration: value })}
            min={0}
            max={86400}
            step={60}
            data-testid="slider-imgbb-expiration"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t.settings.cloud.neverExpires}</span>
            <span>{t.settings.cloud.hours24}</span>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <Label htmlFor="auto-upload" className="flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <div>
              <span>{t.settings.cloud.autoUpload}</span>
              <p className="text-xs text-muted-foreground font-normal">
                {t.settings.cloud.autoUploadDesc}
              </p>
            </div>
          </Label>
          <Switch
            id="auto-upload"
            checked={settings.imgbb?.autoUpload || false}
            onCheckedChange={(checked) => onImgbbUpdate({ autoUpload: checked })}
            disabled={!settings.imgbb?.isValidated}
            data-testid="switch-auto-upload"
          />
        </div>
        {!settings.imgbb?.isValidated && (
          <p className="text-xs text-amber-500">
            Configure and validate API key first
          </p>
        )}
      </CardContent>
    </Card>
  );
});
