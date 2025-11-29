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
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
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

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { settings, updateSettings, updateReticle, resetSettings } = useSettings();
  
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number; photos: number } | null>(null);

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
              Adjust crosshair appearance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable reticle */}
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

            {/* Crosshair size - % of screen */}
            {settings.reticle.enabled && (
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
            )}

            {/* Stroke Width - % of reticle size */}
            {settings.reticle.enabled && (
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
            )}

            {/* Opacity */}
            {settings.reticle.enabled && (
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
            )}

            {/* Show metadata overlay */}
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
              Configure location and orientation tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* GPS Enabled */}
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

            {/* Orientation Enabled */}
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

            {/* Sound Enabled */}
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
              Manage local photo storage
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

        {/* Reset Settings */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowResetDialog(true)}
              data-testid="button-reset-settings"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Settings
            </Button>
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
