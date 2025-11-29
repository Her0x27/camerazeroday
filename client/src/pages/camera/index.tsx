import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useCamera } from "@/hooks/use-camera";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useOrientation } from "@/hooks/use-orientation";
import { useCaptureSound } from "@/hooks/use-capture-sound";
import { useSettings } from "@/lib/settings-context";
import { useDisguise } from "@/lib/disguise-context";
import { getContrastingColor } from "@/components/reticles";
import { savePhoto, getPhotoCounts, getLatestPhoto, updatePhoto } from "@/lib/db";
import { uploadToImgBB } from "@/lib/imgbb";
import type { InsertPhoto } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { CameraControls, PhotoNoteDialog, CameraViewfinder } from "./components";

export default function CameraPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { settings } = useSettings();
  const { settings: disguiseSettings, hideCamera, resetInactivityTimer } = useDisguise();
  const { toast } = useToast();
  
  const [photoCount, setPhotoCount] = useState(0);
  const [cloudCount, setCloudCount] = useState(0);
  const [lastPhotoThumb, setLastPhotoThumb] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [currentNote, setCurrentNote] = useState("");
  const [reticleColor, setReticleColor] = useState<string>("#22c55e");
  const colorSamplingCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    videoRef,
    canvasRef,
    isReady,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    capturePhoto,
  } = useCamera({ facingMode: "environment" });

  const { data: geoData } = useGeolocation(settings.gpsEnabled);

  const {
    data: orientationData,
    isSupported: orientationSupported,
    requestPermission: requestOrientationPermission,
  } = useOrientation(settings.orientationEnabled);

  const { playCapture } = useCaptureSound();

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const counts = await getPhotoCounts();
        setPhotoCount(counts.total);
        setCloudCount(counts.cloud);
        
        if (counts.total > 0) {
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

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  const handleRequestPermissions = useCallback(async () => {
    if (settings.orientationEnabled && orientationSupported) {
      try {
        await requestOrientationPermission();
      } catch (error) {
        console.error("Failed to request orientation permission:", error);
      }
    }
  }, [settings.orientationEnabled, orientationSupported, requestOrientationPermission]);

  const handleMask = useCallback(() => {
    hideCamera();
    navigate("/disguise-game");
  }, [hideCamera, navigate]);

  useEffect(() => {
    if (disguiseSettings.enabled) {
      resetInactivityTimer();
    }
  }, [disguiseSettings.enabled, resetInactivityTimer]);

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
          // Ignore canvas security errors
        }
      }
      
      animationId = requestAnimationFrame(sampleColor);
    };
    
    animationId = requestAnimationFrame(sampleColor);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isReady, settings.reticle.autoColor, settings.reticle.enabled, videoRef]);

  const accuracyBlocked = useMemo(() => {
    if (!settings.gpsEnabled) return false;
    if (geoData.accuracy === null) return false;
    return geoData.accuracy > (settings.accuracyLimit || 20);
  }, [settings.gpsEnabled, settings.accuracyLimit, geoData.accuracy]);

  const handleCapture = useCallback(async () => {
    if (!isReady || isCapturing || accuracyBlocked) return;

    if (settings.soundEnabled) {
      playCapture();
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

      const savedPhoto = await savePhoto(photo);
      setPhotoCount((prev) => prev + 1);
      setLastPhotoThumb(result.thumbnailData);

      if (settings.imgbb?.autoUpload && settings.imgbb?.isValidated && settings.imgbb?.apiKey) {
        if (!navigator.onLine) {
          toast({
            title: t.camera.offline,
            description: t.camera.willUploadWhenOnline,
          });
        } else {
          try {
            const uploadResult = await uploadToImgBB(
              result.imageData,
              settings.imgbb.apiKey,
              settings.imgbb.expiration || 0
            );
            if (uploadResult.success && uploadResult.cloudData) {
              await updatePhoto(savedPhoto.id, { cloud: uploadResult.cloudData });
              setCloudCount((prev) => prev + 1);
              toast({
                title: t.camera.uploaded,
                description: t.camera.photoUploaded,
              });
            } else {
              toast({
                title: t.camera.uploadFailed,
                description: uploadResult.error || t.common.error,
                variant: "destructive",
              });
            }
          } catch (uploadError) {
            console.error("Auto-upload error:", uploadError);
            toast({
              title: t.camera.uploadFailed,
              description: t.camera.cloudUploadFailed,
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Capture error:", error);
    } finally {
      setIsCapturing(false);
    }
  }, [isReady, isCapturing, accuracyBlocked, capturePhoto, geoData, orientationData, currentNote, reticleColor, settings.reticle, settings.imgbb, settings.soundEnabled, settings.watermarkScale, playCapture, toast, t]);

  const handleNavigateGallery = useCallback(() => navigate("/gallery"), [navigate]);
  const handleNavigateSettings = useCallback(() => navigate("/settings"), [navigate]);
  const handleOpenNote = useCallback(() => setShowNoteDialog(true), []);

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col"
      onClick={handleRequestPermissions}
    >
      <CameraViewfinder
        videoRef={videoRef}
        canvasRef={canvasRef}
        isReady={isReady}
        isLoading={cameraLoading}
        error={cameraError}
        onRetry={startCamera}
        reticleConfig={settings.reticle}
        reticleColor={reticleColor}
        geoData={geoData}
        orientationData={orientationData}
        watermarkScale={settings.watermarkScale || 100}
        accuracyLimit={settings.accuracyLimit || 20}
      />

      <CameraControls
        onCapture={handleCapture}
        onNavigateGallery={handleNavigateGallery}
        onNavigateSettings={handleNavigateSettings}
        onOpenNote={handleOpenNote}
        onMask={handleMask}
        isReady={isReady}
        isCapturing={isCapturing}
        accuracyBlocked={accuracyBlocked}
        hasNote={currentNote.length > 0}
        lastPhotoThumb={lastPhotoThumb}
        photoCount={photoCount}
        cloudCount={cloudCount}
        showMaskButton={disguiseSettings.enabled}
      />

      <PhotoNoteDialog
        open={showNoteDialog}
        onOpenChange={setShowNoteDialog}
        note={currentNote}
        onNoteChange={setCurrentNote}
      />
    </div>
  );
}
