import { useState, useRef, useCallback, useEffect } from "react";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
}

interface CapturePhotoOptions {
  latitude?: number | null;
  longitude?: number | null;
  altitude?: number | null;
  accuracy?: number | null;
  heading?: number | null;
  tilt?: number | null;
  note?: string;
  timestamp?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: (options?: CapturePhotoOptions) => Promise<{ imageData: string; thumbnailData: string } | null>;
  switchCamera: () => Promise<void>;
  currentFacing: "user" | "environment";
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode: initialFacing = "environment" } = options;
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFacing, setCurrentFacing] = useState<"user" | "environment">(initialFacing);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Stop any existing stream
      stopCamera();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacing,
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";
      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        setError("Camera access denied. Please allow camera permissions.");
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("DevicesNotFoundError")) {
        setError("No camera found on this device.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentFacing, stopCamera]);

  const switchCamera = useCallback(async () => {
    const newFacing = currentFacing === "environment" ? "user" : "environment";
    setCurrentFacing(newFacing);
  }, [currentFacing]);

  // Restart camera when facing changes
  useEffect(() => {
    if (isReady || isLoading) {
      startCamera();
    }
  }, [currentFacing]);

  const capturePhoto = useCallback(async (options?: CapturePhotoOptions): Promise<{ imageData: string; thumbnailData: string } | null> => {
    if (!videoRef.current || !canvasRef.current || !isReady) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Set canvas to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Draw metadata text if provided
    if (options) {
      const padding = Math.ceil(canvas.width * 0.02);
      const fontSize = Math.ceil(canvas.height * 0.04);
      const lineHeight = Math.ceil(fontSize * 1.2);
      
      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
      ctx.lineWidth = 2;
      ctx.textBaseline = "top";
      
      let y = padding;
      
      // Timestamp
      if (options.timestamp) {
        const date = new Date(options.timestamp);
        const timeStr = date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        ctx.strokeText(timeStr, padding, y);
        ctx.fillText(timeStr, padding, y);
        y += lineHeight;
      }
      
      // GPS Coordinates
      if (options.latitude !== null && options.latitude !== undefined && options.longitude !== null && options.longitude !== undefined) {
        const latStr = `LAT: ${options.latitude.toFixed(6)}°`;
        const lonStr = `LON: ${options.longitude.toFixed(6)}°`;
        ctx.strokeText(latStr, padding, y);
        ctx.fillText(latStr, padding, y);
        y += lineHeight;
        ctx.strokeText(lonStr, padding, y);
        ctx.fillText(lonStr, padding, y);
        y += lineHeight;
      }
      
      // Altitude
      if (options.altitude !== null && options.altitude !== undefined) {
        const altStr = `ALT: ${Math.round(options.altitude)} m`;
        ctx.strokeText(altStr, padding, y);
        ctx.fillText(altStr, padding, y);
        y += lineHeight;
      }
      
      // GPS Accuracy
      if (options.accuracy !== null && options.accuracy !== undefined) {
        const accStr = `ACC: ${Math.round(options.accuracy)} m`;
        ctx.strokeText(accStr, padding, y);
        ctx.fillText(accStr, padding, y);
        y += lineHeight;
      }
      
      // Heading
      if (options.heading !== null && options.heading !== undefined) {
        const headStr = `HDG: ${Math.round(options.heading)}°`;
        ctx.strokeText(headStr, padding, y);
        ctx.fillText(headStr, padding, y);
        y += lineHeight;
      }
      
      // Tilt
      if (options.tilt !== null && options.tilt !== undefined) {
        const tiltStr = `TILT: ${Math.round(options.tilt)}°`;
        ctx.strokeText(tiltStr, padding, y);
        ctx.fillText(tiltStr, padding, y);
        y += lineHeight;
      }
      
      // Note
      if (options.note && options.note.trim()) {
        ctx.strokeText(`NOTE: ${options.note}`, padding, y);
        ctx.fillText(`NOTE: ${options.note}`, padding, y);
      }
    }

    // Get full resolution image
    const imageData = canvas.toDataURL("image/jpeg", 0.92);

    // Create thumbnail
    const thumbCanvas = document.createElement("canvas");
    const thumbCtx = thumbCanvas.getContext("2d");
    const thumbSize = 300;
    const aspectRatio = video.videoWidth / video.videoHeight;
    
    if (aspectRatio > 1) {
      thumbCanvas.width = thumbSize;
      thumbCanvas.height = thumbSize / aspectRatio;
    } else {
      thumbCanvas.height = thumbSize;
      thumbCanvas.width = thumbSize * aspectRatio;
    }

    if (thumbCtx) {
      thumbCtx.drawImage(video, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }

    const thumbnailData = thumbCanvas.toDataURL("image/jpeg", 0.7);

    return { imageData, thumbnailData };
  }, [isReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isReady,
    isLoading,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    currentFacing,
  };
}
