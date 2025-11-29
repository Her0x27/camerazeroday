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
  Loader2
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
import { useSettings } from "@/lib/settings-context";
import { getStorageEstimate, clearAllPhotos, getPhotoCount } from "@/lib/db";
import { validateApiKey } from "@/lib/imgbb";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { settings, updateSettings, updateReticle, resetSettings } = useSettings();
  
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number; photos: number } | null>(null);
  
  const [apiKeyInput, setApiKeyInput] = useState(settings.imgbb?.apiKey || "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setApiKeyInput(settings.imgbb?.apiKey || "");
  }, [settings.imgbb?.apiKey]);

  // Load storage info
  useEffect(() => {
    const loadStorageInfo = async () => {
      try {
        const [estimate, count] = await Promise.all([
          getStorageEstimate(),
          getPhotoCount(),
        ]);
        
        if (estimate) {
          setStorageInfo({
            used: estimate.used,
            quota: estimate.quota,
            photos: count,
          });
        }
      } catch (error) {
        console.error("Failed to load storage info:", error);
      }
    };

    loadStorageInfo();
  }, []);

  // Format bytes for display
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Handle reset settings
  const handleReset = useCallback(async () => {
    await resetSettings();
    setShowResetDialog(false);
  }, [resetSettings]);

  // Handle clear photos
  const handleClearPhotos = useCallback(async () => {
    try {
      await clearAllPhotos();
      setStorageInfo((prev) => prev ? { ...prev, photos: 0 } : null);
    } catch (error) {
      console.error("Clear error:", error);
    }
    setShowClearDialog(false);
  }, []);

  // Handle ImgBB API key validation
  const handleValidateApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      setValidationError("Введите API ключ");
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
        setValidationError(result.error || "Неверный API ключ");
        await updateSettings({
          imgbb: {
            ...settings.imgbb,
            isValidated: false,
          },
        });
      }
    } catch (error) {
      setValidationError("Ошибка проверки ключа");
    } finally {
      setIsValidating(false);
    }
  }, [apiKeyInput, settings.imgbb, updateSettings]);

  // Handle ImgBB settings update
  const handleImgbbUpdate = useCallback(async (updates: Partial<typeof settings.imgbb>) => {
    await updateSettings({
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

      <main className="p-4 space-y-6 max-w-2xl mx-auto safe-bottom pb-8">
        {/* Crosshair Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crosshair className="w-5 h-5 text-primary" />
              Crosshair
            </CardTitle>
            <CardDescription>
              Customize the aiming crosshair display on camera screen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable reticle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="reticle-enabled" className="flex items-center gap-2 cursor-pointer">
                  <Eye className="w-4 h-4" />
                  Show Crosshair
                </Label>
                <Switch
                  id="reticle-enabled"
                  checked={settings.reticle.enabled}
                  onCheckedChange={(checked) => updateReticle({ enabled: checked })}
                  data-testid="switch-reticle-enabled"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Display crosshair overlay in camera viewfinder
              </p>
            </div>

            {/* Crosshair appearance settings */}
            {settings.reticle.enabled && (
              <>
                <Separator />
                
                {/* Crosshair size - % of screen */}
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
                  <p className="text-xs text-muted-foreground">
                    Crosshair size relative to screen
                  </p>
                </div>

                {/* Stroke Width - % of reticle size */}
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
                  <p className="text-xs text-muted-foreground">
                    Line thickness of crosshair
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Crosshair transparency level
                  </p>
                </div>

                <Separator />

                {/* Auto color */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-color" className="flex items-center gap-2 cursor-pointer">
                      <Palette className="w-4 h-4" />
                      Auto Color
                    </Label>
                    <Switch
                      id="auto-color"
                      checked={settings.reticle.autoColor}
                      onCheckedChange={(checked) => updateReticle({ autoColor: checked })}
                      data-testid="switch-auto-color"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Automatically adjust crosshair color for better contrast
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Show metadata overlay */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-metadata" className="flex items-center gap-2 cursor-pointer">
                  <Eye className="w-4 h-4" />
                  Show Metadata
                </Label>
                <Switch
                  id="show-metadata"
                  checked={settings.reticle.showMetadata}
                  onCheckedChange={(checked) => updateReticle({ showMetadata: checked })}
                  data-testid="switch-show-metadata"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Display GPS coordinates, altitude and orientation on screen
              </p>
            </div>

            {/* Watermark Scale */}
            {settings.reticle.showMetadata && (
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
            )}
          </CardContent>
        </Card>

        {/* Capture Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="w-5 h-5 text-primary" />
              Capture
            </CardTitle>
            <CardDescription>
              Configure location tracking and photo capture settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* GPS Enabled */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gps-enabled" className="flex items-center gap-2 cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  GPS Location
                </Label>
                <Switch
                  id="gps-enabled"
                  checked={settings.gpsEnabled}
                  onCheckedChange={(checked) => updateSettings({ gpsEnabled: checked })}
                  data-testid="switch-gps"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Record GPS coordinates when capturing photos
              </p>
            </div>

            {/* GPS Accuracy Limit */}
            {settings.gpsEnabled && (
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
                  Photo capture blocked if GPS accuracy exceeds this limit
                </p>
              </div>
            )}

            <Separator />

            {/* Orientation Enabled */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="orientation-enabled" className="flex items-center gap-2 cursor-pointer">
                  <Compass className="w-4 h-4" />
                  Compass & Orientation
                </Label>
                <Switch
                  id="orientation-enabled"
                  checked={settings.orientationEnabled}
                  onCheckedChange={(checked) => updateSettings({ orientationEnabled: checked })}
                  data-testid="switch-orientation"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Record compass heading and device tilt angle
              </p>
            </div>

            <Separator />

            {/* Sound Enabled */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled" className="flex items-center gap-2 cursor-pointer">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  Capture Sound
                </Label>
                <Switch
                  id="sound-enabled"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                  data-testid="switch-sound"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Play shutter sound when taking a photo
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cloud Upload (ImgBB) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="w-5 h-5 text-primary" />
              Cloud Upload (ImgBB)
            </CardTitle>
            <CardDescription>
              Configure automatic photo upload to ImgBB cloud storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API Key */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Token
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter ImgBB API key"
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
                    "Validate"
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
                  API key validated
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Get a free API key at{" "}
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
                  Photo Expiration
                </Label>
                <span className="text-sm text-muted-foreground font-mono">
                  {(settings.imgbb?.expiration || 0) === 0 
                    ? "Never" 
                    : `${settings.imgbb?.expiration} sec`}
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
                <span>0 = never expires</span>
                <span>86400 = 24 hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Photo will be automatically deleted from ImgBB after expiration
              </p>
            </div>

            <Separator />

            {/* Auto Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-upload" className="flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Auto Upload
                </Label>
                <Switch
                  id="auto-upload"
                  checked={settings.imgbb?.autoUpload || false}
                  onCheckedChange={(checked) => handleImgbbUpdate({ autoUpload: checked })}
                  disabled={!settings.imgbb?.isValidated}
                  data-testid="switch-auto-upload"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically upload photos to cloud immediately after capture
              </p>
              {!settings.imgbb?.isValidated && settings.imgbb?.autoUpload === false && (
                <p className="text-xs text-amber-500">
                  Please configure and validate API key first
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="w-5 h-5 text-primary" />
              Storage
            </CardTitle>
            <CardDescription>
              View and manage locally stored photos on your device
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
                
                {/* Storage progress bar */}
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

            <div className="space-y-2">
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
              <p className="text-xs text-muted-foreground text-center">
                Permanently delete all photos from local storage
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reset Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RotateCcw className="w-5 h-5 text-primary" />
              Reset
            </CardTitle>
            <CardDescription>
              Restore all settings to factory defaults
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowResetDialog(true)}
                data-testid="button-reset-settings"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All Settings
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Your photos will not be affected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App info */}
        <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
          <div className="flex items-center justify-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" />
            <span className="font-semibold">Camera ZeroDay</span>
          </div>
          <p>Tactical Camera PWA</p>
          <p>Photos are stored locally on your device</p>
        </div>
      </main>

      {/* Reset settings dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all settings to their default values. Your photos will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} data-testid="button-confirm-reset">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear photos dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Photos?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {storageInfo?.photos || 0} photos from your device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear-storage">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearPhotos}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-clear-storage"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
