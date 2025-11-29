import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  GeneralSettingsSection,
  WatermarkSection,
  ReticleSection,
  CaptureLocationSection,
  CloudUploadSection,
  StorageSection,
  DisguiseSection,
  PWASection,
  ResetSection,
} from "./sections";

export default function SettingsPage() {
  const [, navigate] = useLocation();
  const { settings, updateSettings, updateReticle, resetSettings } = useSettings();
  const { language, setLanguage, availableLanguages, t } = useI18n();
  const { canInstall, isInstalled, isInstalling, install, showIOSInstructions } = usePWA();
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
  
  const validationAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setApiKeyInput(settings.imgbb?.apiKey || "");
  }, [settings.imgbb?.apiKey]);
  
  useEffect(() => {
    return () => {
      if (validationAbortControllerRef.current) {
        validationAbortControllerRef.current.abort();
        validationAbortControllerRef.current = null;
      }
    };
  }, []);

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

  const handlePatternDraw = useCallback((pattern: number[]) => {
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
  }, [patternStep, tempPattern, updateDisguiseSettings]);

  const handleCancelPatternSetup = useCallback(() => {
    setShowPatternSetup(false);
    setPatternStep('draw');
    setTempPattern('');
    setPatternError(false);
  }, []);

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKeyInput(value);
    if (settings.imgbb?.isValidated) {
      updateSettings({
        imgbb: {
          ...settings.imgbb,
          isValidated: false,
        },
      });
    }
  }, [settings.imgbb, updateSettings]);

  const handleValidateApiKey = useCallback(async () => {
    if (!apiKeyInput.trim()) {
      setValidationError(t.settings.cloud.pleaseEnterApiKey);
      return;
    }

    if (validationAbortControllerRef.current) {
      validationAbortControllerRef.current.abort();
    }
    validationAbortControllerRef.current = new AbortController();

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateApiKey(
        apiKeyInput.trim(),
        validationAbortControllerRef.current.signal
      );
      
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
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setValidationError(t.settings.cloud.validationError);
    } finally {
      validationAbortControllerRef.current = null;
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

  const handleShowClearDialog = useCallback(() => setShowClearDialog(true), []);
  const handleShowResetDialog = useCallback(() => setShowResetDialog(true), []);
  const handleShowPatternSetup = useCallback(() => setShowPatternSetup(true), []);

  return (
    <div className="min-h-screen bg-background">
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
        <GeneralSettingsSection
          settings={settings}
          updateSettings={updateSettings}
          language={language}
          setLanguage={setLanguage}
          availableLanguages={availableLanguages}
          t={t}
        />

        <WatermarkSection
          settings={settings}
          updateSettings={updateSettings}
          updateReticle={updateReticle}
        />

        <ReticleSection
          settings={settings}
          updateReticle={updateReticle}
        />

        <CaptureLocationSection
          settings={settings}
          updateSettings={updateSettings}
        />

        <CloudUploadSection
          settings={settings}
          apiKeyInput={apiKeyInput}
          onApiKeyChange={handleApiKeyChange}
          isValidating={isValidating}
          validationError={validationError}
          onValidateApiKey={handleValidateApiKey}
          onImgbbUpdate={handleImgbbUpdate}
          t={t}
        />

        <StorageSection
          storageInfo={storageInfo}
          onShowClearDialog={handleShowClearDialog}
        />

        <DisguiseSection
          disguiseSettings={disguiseSettings}
          updateDisguiseSettings={updateDisguiseSettings}
          onShowPatternSetup={handleShowPatternSetup}
          t={t}
        />

        <PWASection
          canInstall={canInstall}
          isInstalled={isInstalled}
          isInstalling={isInstalling}
          install={install}
          showIOSInstructions={showIOSInstructions}
          t={t}
        />

        <ResetSection
          onShowResetDialog={handleShowResetDialog}
          t={t}
        />

        <div className="text-center text-xs text-muted-foreground space-y-1 pt-4">
          <div className="flex items-center justify-center gap-2">
            <Crosshair className="w-4 h-4 text-primary" />
            <span className="font-semibold">{t.settings.appInfo.title}</span>
          </div>
          <p>{t.settings.appInfo.subtitle}</p>
          <p>{t.settings.appInfo.storageNote}</p>
        </div>
      </main>

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
