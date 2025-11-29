import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft, 
  Crosshair, 
  MapPin, 
  Compass, 
  Volume2, 
  VolumeX,
  Eye,
  RotateCcw,
  Database,
  Trash2,
  Palette,
  Target,
  Type,
  Cloud,
  Key,
  Clock,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Settings2,
  ImageIcon,
  Camera,
  Languages,
  Smartphone,
  Download,
  Wifi,
  WifiOff,
  Share2,
  Gamepad2,
  Hand,
  Clock3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettings } from "@/lib/settings-context";
import { useI18n } from "@/lib/i18n";
import { usePWA } from "@/hooks/use-pwa";
import { useDisguise } from "@/lib/disguise-context";
import { useStorage } from "@/hooks/use-storage";
import { validateApiKey } from "@/lib/imgbb";
import { PatternLock, patternToString } from "@/components/pattern-lock";
import { formatBytes } from "@/lib/date-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { settings, updateSettings, updateReticle, resetSettings } = useSettings();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const { canInstall, isInstalled, isInstalling, install, isIOS, showIOSInstructions } = usePWA();
  const { settings: disguiseSettings, updateSettings: updateDisguiseSettings } = useDisguise();
  
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showPatternSetup, setShowPatternSetup] = useState(false);
  const [patternStep, setPatternStep] = useState<'draw' | 'confirm'>('draw');
  const [tempPattern, setTempPattern] = useState<string>('');
  const [patternError, setPatternError] = useState(false);
  
  const { storageInfo, clearStorage } = useStorage();
  
  const [apiKeyInput, setApiKeyInput] = useState(settings.imgbb?.apiKey || "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setApiKeyInput(settings.imgbb?.apiKey || "");
  }, [settings.imgbb?.apiKey]);

  const handleReset = useCallback(async () => {
    await resetSettings();
    setShowResetDialog(false);
  }, [resetSettings]);

  const handleClearPhotos = useCallback(async () => {
    try {
      await clearStorage();
    } catch (error) {
      console.error("Clear error:", error);
    }
    setShowClearDialog(false);
  }, [clearStorage]);

  const handlePatternDraw = (pattern: number[]) => {
    const patternStr = patternToString(pattern);
    
    if (patternStep === 'draw') {
      setTempPattern(patternStr);
      setPatternStep('confirm');
      setPatternError(false);
    } else {
      if (patternStr === tempPattern) {
        updateDisguiseSettings({ secretPattern: patternStr });
        setShowPatternSetup(false);
        setPatternStep('draw');
        setTempPattern('');
        setPatternError(false);
      } else {
        setPatternError(true);
        setTimeout(() => setPatternError(false), 1000);
      }
    }
  };

  const handleCancelPatternSetup = () => {
    setShowPatternSetup(false);
    setPatternStep('draw');
    setTempPattern('');
    setPatternError(false);
  };

  const handleValidateApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      setValidationError("Please enter API key");
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateApiKey(apiKeyInput.trim());
      
      if (result.valid) {
        await updateSettings({
          imgbb: {
            ...settings.imgbb,
            apiKey: apiKeyInput.trim(),
            isValidated: true,
          },
        });
        setValidationError(null);
      } else {
        setValidationError(result.error || "Invalid API key");
        await updateSettings({
          imgbb: {
            ...settings.imgbb,
            isValidated: false,
          },
        });
      }
    } catch (error) {
      setValidationError("Key validation error");
    } finally {
      setIsValidating(false);
    }
  }, [apiKeyInput, settings.imgbb, updateSettings]);

  const handleImgbbUpdate = useCallback((updates: Partial<typeof settings.imgbb>) => {
    updateSettings({
      imgbb: {
        ...settings.imgbb,
        ...updates,
      },
    });
  }, [settings.imgbb, updateSettings]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back-camera"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-2xl mx-auto safe-bottom pb-8">
        
        {/* General Settings */}
        <Card>
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
            {/* Language */}
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

            {/* Sound */}
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

        {/* Watermark Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="w-5 h-5 text-primary" />
              Watermark
            </CardTitle>
            <CardDescription>
              Metadata display on captured photos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show metadata overlay */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-metadata" className="flex items-center gap-2 cursor-pointer">
                <Eye className="w-4 h-4" />
                <div>
                  <span>Show Metadata</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Display GPS, altitude and orientation on screen
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

            {/* Watermark Scale */}
            {settings.reticle.showMetadata && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Watermark Size
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
                    Size of metadata watermarks on captured photos
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Crosshair Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Crosshair className="w-5 h-5 text-primary" />
              Crosshair
            </CardTitle>
            <CardDescription>
              Aiming crosshair display on camera screen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable reticle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="reticle-enabled" className="flex items-center gap-2 cursor-pointer">
                <Eye className="w-4 h-4" />
                <div>
                  <span>Show Crosshair</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Display crosshair overlay in viewfinder
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

            {/* Crosshair appearance settings */}
            {settings.reticle.enabled && (
              <>
                <Separator />
                
                {/* Crosshair size */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4" />
                      Size
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

                {/* Stroke Width */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4" />
                      Thickness
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

                {/* Opacity */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Opacity
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

                {/* Auto color */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-color" className="flex items-center gap-2 cursor-pointer">
                    <Palette className="w-4 h-4" />
                    <div>
                      <span>Auto Color</span>
                      <p className="text-xs text-muted-foreground font-normal">
                        Adjust crosshair color for better contrast
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
          </CardContent>
        </Card>

        {/* Capture / Location Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Camera className="w-5 h-5 text-primary" />
              Capture / Location
            </CardTitle>
            <CardDescription>
              GPS and device orientation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GPS Enabled */}
            <div className="flex items-center justify-between">
              <Label htmlFor="gps-enabled" className="flex items-center gap-2 cursor-pointer">
                <MapPin className="w-4 h-4" />
                <div>
                  <span>GPS Location</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Record GPS coordinates when capturing
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

            {/* GPS Accuracy Limit */}
            {settings.gpsEnabled && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Accuracy Limit
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
                    Block photo capture if GPS accuracy exceeds this limit
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Orientation Enabled */}
            <div className="flex items-center justify-between">
              <Label htmlFor="orientation-enabled" className="flex items-center gap-2 cursor-pointer">
                <Compass className="w-4 h-4" />
                <div>
                  <span>Compass & Orientation</span>
                  <p className="text-xs text-muted-foreground font-normal">
                    Record heading and device tilt angle
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
          </CardContent>
        </Card>

        {/* Cloud Upload (ImgBB) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="w-5 h-5 text-primary" />
              Cloud Upload (ImgBB)
            </CardTitle>
            <CardDescription>
              Automatic photo upload to ImgBB cloud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key */}
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
                  onChange={(e) => {
                    setApiKeyInput(e.target.value);
                    if (settings.imgbb?.isValidated) {
                      handleImgbbUpdate({ isValidated: false });
                    }
                  }}
                  data-testid="input-imgbb-api-key"
                />
                <Button
                  variant="outline"
                  onClick={handleValidateApiKey}
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

            {/* Expiration */}
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
                onValueChange={([value]) => handleImgbbUpdate({ expiration: value })}
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

            {/* Auto Upload */}
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
                onCheckedChange={(checked) => handleImgbbUpdate({ autoUpload: checked })}
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

        {/* Storage */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-primary" />
              Storage
            </CardTitle>
            <CardDescription>
              Locally stored photos on your device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {storageInfo && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Photos stored</span>
                  <span className="font-medium">{storageInfo.photos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage used</span>
                  <span className="font-medium">{formatBytes(storageInfo.used)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
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
              onClick={() => setShowClearDialog(true)}
              disabled={!storageInfo || storageInfo.photos === 0}
              data-testid="button-clear-storage"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Photos
            </Button>
          </CardContent>
        </Card>

        {/* Disguise Mode */}
        <Card>
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
            {/* Enable Disguise Mode */}
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

                {/* Secret Gesture */}
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
                    {disguiseSettings.gestureType === 'quickTaps' ? '4 quick taps on game to access camera' : '3 taps to show pattern, then draw to unlock'}
                  </p>
                </div>

                {/* Pattern Setup */}
                {disguiseSettings.gestureType === 'patternUnlock' && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        {disguiseSettings.secretPattern ? 'Change Pattern' : 'Set Pattern'}
                      </Label>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowPatternSetup(true)}
                        data-testid="button-set-pattern"
                      >
                        {disguiseSettings.secretPattern ? 'Change Secret Pattern' : 'Set Secret Pattern'}
                      </Button>
                      {!disguiseSettings.secretPattern && (
                        <p className="text-xs text-amber-500">
                          Pattern not set. Camera will not be accessible until pattern is set.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Auto Lock */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      {t.settings.disguise.autoLock}
                    </Label>
                    <span className="text-sm text-muted-foreground font-mono">
                      {disguiseSettings.autoLockMinutes} min
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

        {/* PWA */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="w-5 h-5 text-primary" />
              {t.settings.pwa.title}
            </CardTitle>
            <CardDescription>
              {t.settings.pwa.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Install Status */}
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

            {/* Offline Status */}
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
          </CardContent>
        </Card>

        {/* Reset Settings */}
        <Card>
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
              onClick={() => setShowResetDialog(true)}
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

        {/* App info */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
          <div className="flex items-center justify-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" />
            <span className="font-semibold">{t.settings.appInfo.title}</span>
          </div>
          <p>{t.settings.appInfo.subtitle}</p>
          <p>{t.settings.appInfo.storageNote}</p>
        </div>
      </main>

      {/* Reset settings dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.settings.dialogs.resetTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.settings.dialogs.resetDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} data-testid="button-confirm-reset">
              {t.common.reset}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear photos dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.settings.dialogs.clearTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.settings.dialogs.clearDescription.replace('{count}', String(storageInfo?.photos || 0))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear-storage">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearPhotos}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-clear-storage"
            >
              {t.settings.dialogs.clearAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pattern setup dialog */}
      <Dialog open={showPatternSetup} onOpenChange={setShowPatternSetup}>
        <DialogContent data-testid="pattern-setup-dialog" className="w-full max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {patternStep === 'draw' ? 'Draw Your Pattern' : 'Confirm Your Pattern'}
            </DialogTitle>
            <DialogDescription>
              {patternStep === 'draw' 
                ? 'Connect at least 4 dots to create your secret pattern'
                : 'Draw the same pattern again to confirm'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-6 py-4">
            <div className={`p-4 rounded-xl bg-muted/30 ${patternError ? 'animate-shake ring-2 ring-destructive' : ''}`}>
              <PatternLock
                onPatternComplete={handlePatternDraw}
                size={220}
                dotSize={18}
                lineColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                activeDotColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
              />
            </div>
            
            {patternError && (
              <p className="text-sm text-destructive">
                Patterns don't match. Try again.
              </p>
            )}
          </div>
          
          <div className="flex gap-2 justify-end">
            {patternStep === 'confirm' && (
              <Button
                variant="outline"
                onClick={() => {
                  setPatternStep('draw');
                  setTempPattern('');
                  setPatternError(false);
                }}
                data-testid="button-pattern-back"
              >
                Back
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleCancelPatternSetup}
              data-testid="button-pattern-cancel"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
