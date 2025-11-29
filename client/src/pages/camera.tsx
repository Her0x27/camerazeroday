import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { Camera, Settings, Image, Crosshair, Wifi, WifiOff, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useOrientation } from "@/hooks/use-orientation";
import { useSettings } from "@/lib/settings-context";
import { Reticle, getContrastingColor } from "@/components/reticles";
import { MetadataOverlay } from "@/components/metadata-overlay";
import { savePhoto, getPhotoCount, getLatestPhoto } from "@/lib/db";
import type { InsertPhoto } from "@shared/schema";

export default function CameraPage() {
  const [, navigate] = useLocation();
  const { settings } = useSettings();
  
  const [photoCount, setPhotoCount] = useState(0);
  const [lastPhotoThumb, setLastPhotoThumb] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [reticleColor, setReticleColor] = useState<string>("#22c55e");
  const colorSamplingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera hook
  const {
    videoRef,
    canvasRef,
    isReady,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    capturePhoto,
  } = useCamera({ facingMode: "environment" });

  // Geolocation hook
  const {
    data: geoData,
  } = useGeolocation(settings.gpsEnabled);

  // Orientation hook
  const {
    data: orientationData,
    isSupported: orientationSupported,
    requestPermission: requestOrientationPermission,
  } = useOrientation(settings.orientationEnabled);

  // Load photo count and last photo thumb
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const count = await getPhotoCount();
        setPhotoCount(count);
        
        if (count > 0) {
          const latest = await getLatestPhoto();
          if (latest) {
            setLastPhotoThumb(latest.thumbnailData);
          }
        }
      } catch (error) {
        console.error("Failed to load photos:", error);
      }
    };
    loadPhotos();
  }, []);

  // Start camera on mount
  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Request orientation permission on first tap (iOS requirement)
  const handleRequestPermissions = useCallback(async () => {
    if (settings.orientationEnabled && orientationSupported) {
      await requestOrientationPermission();
    }
  }, [settings.orientationEnabled, orientationSupported, requestOrientationPermission]);

  // Auto-color sampling for reticle
  useEffect(() => {
    if (!isReady || !settings.reticle.autoColor || !settings.reticle.enabled) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    if (!colorSamplingCanvasRef.current) {
      colorSamplingCanvasRef.current = document.createElement("canvas");
      colorSamplingCanvasRef.current.width = 50;
      colorSamplingCanvasRef.current.height = 50;
    }
    
    const canvas = colorSamplingCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    
    let animationId: number;
    let lastUpdate = 0;
    const updateInterval = 100;
    
    const sampleColor = (timestamp: number) => {
      if (timestamp - lastUpdate < updateInterval) {
        animationId = requestAnimationFrame(sampleColor);
        return;
      }
      lastUpdate = timestamp;
      
      if (video.readyState >= 2) {
        const centerX = video.videoWidth / 2 - 25;
        const centerY = video.videoHeight / 2 - 25;
        
        try {
          ctx.drawImage(video, centerX, centerY, 50, 50, 0, 0, 50, 50);
          const imageData = ctx.getImageData(0, 0, 50, 50);
          const data = imageData.data;
          
          let r = 0, g = 0, b = 0;
          const sampleSize = data.length / 4;
          
          for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
          }
          
          r = Math.round(r / sampleSize);
          g = Math.round(g / sampleSize);
          b = Math.round(b / sampleSize);
          
          const newColor = getContrastingColor(r, g, b);
          setReticleColor(newColor);
        } catch {
        }
      }
      
      animationId = requestAnimationFrame(sampleColor);
    };
    
    animationId = requestAnimationFrame(sampleColor);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isReady, settings.reticle.autoColor, settings.reticle.enabled, videoRef]);

  // Check if GPS accuracy is acceptable - use useMemo to ensure reactivity
  const accuracyBlocked = useMemo(() => {
    if (!settings.gpsEnabled) return false;
    if (geoData.accuracy === null) return false;
    return geoData.accuracy > (settings.accuracyLimit || 20);
  }, [settings.gpsEnabled, settings.accuracyLimit, geoData.accuracy]);

  const isAccuracyAcceptable = useCallback(() => {
    return !accuracyBlocked;
  }, [accuracyBlocked]);

  // Capture and save photo directly
  const handleCapture = useCallback(async () => {
    if (!isReady || isCapturing) return;
    
    // Block capture if accuracy is worse than limit
    if (!isAccuracyAcceptable()) {
      return;
    }

    setIsCapturing(true);
    const timestamp = Date.now();
    const noteText = currentNote.trim();
    
    try {
      const result = await capturePhoto({
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        altitude: geoData.altitude,
        accuracy: geoData.accuracy,
        heading: orientationData.heading,
        tilt: orientationData.tilt,
        note: noteText || undefined,
        timestamp,
        reticleConfig: settings.reticle,
        reticleColor: reticleColor,
        watermarkScale: settings.watermarkScale || 100,
      });
      if (!result) {
        throw new Error("Failed to capture photo");
      }

      // Save photo with note as folder name
      const photo: InsertPhoto = {
        imageData: result.imageData,
        thumbnailData: result.thumbnailData,
        metadata: {
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          altitude: geoData.altitude,
          accuracy: geoData.accuracy,
          heading: orientationData.heading,
          tilt: orientationData.tilt,
          timestamp,
        },
        note: noteText || undefined,
        folder: noteText || undefined,
      };

      await savePhoto(photo);
      setPhotoCount((prev) => prev + 1);
      setLastPhotoThumb(result.thumbnailData);
    } catch (error) {
      console.error("Capture error:", error);
    } finally {
      setIsCapturing(false);
    }
  }, [isReady, isCapturing, capturePhoto, geoData, orientationData, currentNote, reticleColor, settings.reticle, isAccuracyAcceptable]);

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col"
      onClick={handleRequestPermissions}
    >
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Camera viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        {/* Video element */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          autoPlay
          muted
        />

        {/* Camera loading/error states */}
        {cameraLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="flex flex-col items-center gap-3">
              <Camera className="w-12 h-12 text-primary animate-pulse" />
              <span className="text-sm text-white/70">Starting camera...</span>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
              <Camera className="w-12 h-12 text-destructive" />
              <span className="text-sm text-white">{cameraError}</span>
              <Button onClick={startCamera} variant="outline" size="sm" data-testid="button-retry-camera">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Viewfinder gradient overlay */}
        <div className="absolute inset-0 viewfinder-overlay pointer-events-none" />

        {/* Reticle overlay */}
        {isReady && <Reticle config={settings.reticle} dynamicColor={reticleColor} />}

        {/* Top bar and metadata container */}
        <div className="absolute top-0 left-0 right-0 safe-top z-10">
          {/* Top bar */}
          <div className="flex items-center justify-center gap-4 px-4 py-3">
            {/* App branding */}
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-primary" />
              <span className="font-semibold text-white text-sm tracking-wide">ZERODAY</span>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-3">
              {/* Online/Offline indicator */}
              {isOnline ? (
                <Wifi className="w-4 h-4 text-primary" />
              ) : (
                <WifiOff className="w-4 h-4 text-muted-foreground" />
              )}

              {/* Settings button */}
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
                onClick={() => navigate("/settings")}
                data-testid="button-settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Metadata overlay - positioned relative to top bar */}
          {isReady && (
            <MetadataOverlay
              latitude={geoData.latitude}
              longitude={geoData.longitude}
              altitude={geoData.altitude}
              accuracy={geoData.accuracy}
              heading={orientationData.heading}
              tilt={orientationData.tilt}
              showMetadata={settings.reticle.showMetadata}
              lastUpdate={geoData.lastUpdate}
              scale={settings.watermarkScale || 100}
              accuracyLimit={settings.accuracyLimit || 20}
            />
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="bg-black/80 backdrop-blur-sm safe-bottom z-10">
        <div className="flex items-center justify-center gap-[5%] px-[5%] py-2 h-20">
          {/* Gallery button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-md bg-card/50 text-white hover:bg-card relative aspect-square flex-1 max-w-[22%]"
            onClick={() => navigate("/gallery")}
            data-testid="button-gallery"
          >
            <Image className="w-[50%] h-[50%]" />
            {photoCount > 0 && (
              <span className="absolute -top-1 -right-1 w-[20%] min-w-5 h-[20%] min-h-5 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center justify-center">
                {photoCount > 99 ? "99+" : photoCount}
              </span>
            )}
          </Button>

          {/* Capture button */}
          <button
            onClick={handleCapture}
            disabled={!isReady || isCapturing || accuracyBlocked}
            className={`aspect-square flex-1 max-w-20 rounded-full border-3 flex items-center justify-center transition-all overflow-hidden ${
              accuracyBlocked
                ? "border-red-500/50 bg-red-500/10"
                : isReady && !isCapturing
                  ? "border-white bg-white/10 hover:bg-white/20 active:scale-95 active:bg-white/30"
                  : "border-muted-foreground/50 bg-muted/20"
            }`}
            data-testid="button-capture"
          >
            {accuracyBlocked ? (
              <div className="w-[70%] h-[70%] rounded-full bg-red-500/30 flex items-center justify-center">
                <span className="text-red-500 text-xs font-bold">GPS</span>
              </div>
            ) : lastPhotoThumb ? (
              <img 
                src={lastPhotoThumb} 
                alt="Last photo" 
                className="w-full h-full object-cover rounded-full opacity-70"
              />
            ) : (
              <div 
                className={`w-[70%] h-[70%] rounded-full transition-all ${
                  isCapturing 
                    ? "bg-primary scale-75" 
                    : isReady 
                      ? "bg-white" 
                      : "bg-muted"
                }`}
              />
            )}
          </button>

          {/* Note button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-md bg-card/50 text-white hover:bg-card relative aspect-square flex-1 max-w-[22%]"
            onClick={() => setShowNoteDialog(true)}
            data-testid="button-note"
          >
            <FileText className="w-[50%] h-[50%]" />
            {currentNote && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        </div>
      </div>

      {/* Note dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Add Note
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="Enter note..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              className="min-h-[100px] resize-none"
              data-testid="input-note"
              autoFocus
            />
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNoteDialog(false)}
                data-testid="button-close-note"
              >
                Done
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentNote("")}
                data-testid="button-clear-note"
              >
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
