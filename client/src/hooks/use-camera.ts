import { useState, useRef, useCallback, useEffect } from "react";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
}

interface PhotoMetadata {
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
  capturePhoto: (metadata?: PhotoMetadata) => Promise<{ imageData: string; thumbnailData: string } | null>;
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

  const drawMetadata = (ctx: CanvasRenderingContext2D, width: number, height: number, metadata?: PhotoMetadata) => {
    if (!metadata) return;
    
    const padding = Math.ceil(width * 0.02);
    const fontSize = Math.ceil(height * 0.028);
    const lineHeight = fontSize * 1.4;
    const topOffset = Math.ceil(height * 0.08);
    
    // Draw crosshair in center
    const centerX = width / 2;
    const centerY = height / 2;
    const reticleSize = Math.ceil(Math.min(width, height) * 0.08);
    
    ctx.strokeStyle = "rgba(34, 197, 94, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - reticleSize, centerY);
    ctx.lineTo(centerX + reticleSize, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - reticleSize);
    ctx.lineTo(centerX, centerY + reticleSize);
    ctx.stroke();
    
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.textBaseline = "top";
    
    // LEFT PANEL - GPS Data
    let yLeft = topOffset;
    const leftX = padding;
    
    if (metadata.latitude !== null && metadata.latitude !== undefined && metadata.longitude !== null && metadata.longitude !== undefined) {
      ctx.strokeText(`${metadata.latitude.toFixed(6)}°`, leftX, yLeft);
      ctx.fillText(`${metadata.latitude.toFixed(6)}°`, leftX, yLeft);
      yLeft += lineHeight;
      ctx.strokeText(`${metadata.longitude.toFixed(6)}°`, leftX, yLeft);
      ctx.fillText(`${metadata.longitude.toFixed(6)}°`, leftX, yLeft);
      yLeft += lineHeight;
    }
    
    if (metadata.altitude !== null && metadata.altitude !== undefined) {
      ctx.strokeText(`${Math.round(metadata.altitude)} m`, leftX, yLeft);
      ctx.fillText(`${Math.round(metadata.altitude)} m`, leftX, yLeft);
      yLeft += lineHeight;
    }
    
    if (metadata.accuracy !== null && metadata.accuracy !== undefined) {
      ctx.strokeText(`ACC: ${Math.round(metadata.accuracy)}m`, leftX, yLeft);
      ctx.fillText(`ACC: ${Math.round(metadata.accuracy)}m`, leftX, yLeft);
    }
    
    // RIGHT PANEL - Orientation Data
    let yRight = topOffset;
    const rightX = width - padding - Math.ceil(width * 0.15);
    
    if (metadata.heading !== null && metadata.heading !== undefined) {
      ctx.strokeText(`${Math.round(metadata.heading)}°`, rightX, yRight);
      ctx.fillText(`${Math.round(metadata.heading)}°`, rightX, yRight);
      yRight += lineHeight;
    }
    
    if (metadata.tilt !== null && metadata.tilt !== undefined) {
      ctx.strokeText(`TILT: ${Math.round(metadata.tilt)}°`, rightX, yRight);
      ctx.fillText(`TILT: ${Math.round(metadata.tilt)}°`, rightX, yRight);
    }
    
    // TIMESTAMP - Bottom center
    if (metadata.timestamp) {
      const date = new Date(metadata.timestamp);
      const timeStr = date.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const smallFontSize = Math.ceil(fontSize * 0.8);
      ctx.font = `${smallFontSize}px monospace`;
      const textMetrics = ctx.measureText(timeStr);
      const timeX = (width - textMetrics.width) / 2;
      const timeY = height - padding - smallFontSize;
      ctx.strokeText(timeStr, timeX, timeY);
      ctx.fillText(timeStr, timeX, timeY);
    }
    
    // NOTE - Below timestamp
    if (metadata.note && metadata.note.trim()) {
      const smallFontSize = Math.ceil(fontSize * 0.75);
      ctx.font = `${smallFontSize}px monospace`;
      const noteText = `NOTE: ${metadata.note}`;
      const textMetrics = ctx.measureText(noteText);
      const noteX = Math.max(padding, (width - textMetrics.width) / 2);
      const noteY = height - padding - smallFontSize * 2.5;
      ctx.strokeText(noteText, noteX, noteY);
      ctx.fillText(noteText, noteX, noteY);
    }
  };

  const capturePhoto = useCallback(async (metadata?: PhotoMetadata): Promise<{ imageData: string; thumbnailData: string } | null> => {
    if (!videoRef.current || !canvasRef.current || !isReady) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);
    drawMetadata(ctx, canvas.width, canvas.height, metadata);

    const imageData = canvas.toDataURL("image/jpeg", 0.92);

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
      drawMetadata(thumbCtx, thumbCanvas.width, thumbCanvas.height, metadata);
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
