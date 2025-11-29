import { useState, useRef, useCallback, useEffect } from "react";
import { formatCoordinate, formatAltitude, formatAccuracy, formatCoordinatesWithAccuracy } from "./use-geolocation";
import { formatHeading, getCardinalDirection, formatTilt } from "./use-orientation";
import type { ReticleConfig } from "@shared/schema";

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
  reticleConfig?: ReticleConfig;
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

  // Icon drawing helper functions
  const drawMapPinIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size * 0.35;
    
    // Draw pin body (teardrop shape)
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.1, r, Math.PI * 0.2, Math.PI * 0.8, true);
    ctx.lineTo(cx, cy + size * 0.4);
    ctx.closePath();
    ctx.stroke();
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.1, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawMountainIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    ctx.beginPath();
    ctx.moveTo(x + size * 0.1, y + size * 0.8);
    ctx.lineTo(x + size * 0.4, y + size * 0.2);
    ctx.lineTo(x + size * 0.55, y + size * 0.45);
    ctx.lineTo(x + size * 0.7, y + size * 0.25);
    ctx.lineTo(x + size * 0.9, y + size * 0.8);
    ctx.stroke();
    ctx.restore();
  };

  const drawSignalIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    
    const barWidth = size * 0.18;
    const gap = size * 0.08;
    const heights = [0.3, 0.5, 0.7, 0.9];
    
    heights.forEach((h, i) => {
      const barX = x + i * (barWidth + gap) + size * 0.1;
      const barHeight = size * h;
      const barY = y + size - barHeight - size * 0.05;
      ctx.fillRect(barX, barY, barWidth, barHeight);
    });
    ctx.restore();
  };

  const drawCompassIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = size * 0.1;
    
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size * 0.4;
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw north arrow
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.7);
    ctx.lineTo(cx - r * 0.25, cy + r * 0.3);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + r * 0.25, cy + r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawTargetIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = "round";
    
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size * 0.35;
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw crosshair
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.3, cy);
    ctx.lineTo(cx + r * 1.3, cy);
    ctx.moveTo(cx, cy - r * 1.3);
    ctx.lineTo(cx, cy + r * 1.3);
    ctx.stroke();
    ctx.restore();
  };

  const drawFileTextIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Draw file outline
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y + size * 0.1);
    ctx.lineTo(x + size * 0.6, y + size * 0.1);
    ctx.lineTo(x + size * 0.8, y + size * 0.3);
    ctx.lineTo(x + size * 0.8, y + size * 0.9);
    ctx.lineTo(x + size * 0.2, y + size * 0.9);
    ctx.closePath();
    ctx.stroke();
    
    // Draw fold
    ctx.beginPath();
    ctx.moveTo(x + size * 0.6, y + size * 0.1);
    ctx.lineTo(x + size * 0.6, y + size * 0.3);
    ctx.lineTo(x + size * 0.8, y + size * 0.3);
    ctx.stroke();
    
    // Draw lines
    ctx.beginPath();
    ctx.moveTo(x + size * 0.3, y + size * 0.5);
    ctx.lineTo(x + size * 0.7, y + size * 0.5);
    ctx.moveTo(x + size * 0.3, y + size * 0.7);
    ctx.lineTo(x + size * 0.7, y + size * 0.7);
    ctx.stroke();
    ctx.restore();
  };

  const drawRoundedRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      const radius = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }
  };

  const drawMetadata = (ctx: CanvasRenderingContext2D, width: number, height: number, metadata?: PhotoMetadata) => {
    if (!metadata) return;
    
    const reticleConfig = metadata.reticleConfig;
    const minDimension = Math.min(width, height);
    const padding = Math.ceil(minDimension * 0.015);
    const fontSize = Math.ceil(minDimension * 0.022);
    const lineHeight = fontSize * 1.6;
    const topOffset = Math.ceil(minDimension * 0.025);
    const iconSize = Math.ceil(fontSize * 1.1);
    const iconGap = Math.ceil(fontSize * 0.5);
    
    // Draw crosshair in center - using reticle config settings (all percentages)
    if (reticleConfig?.enabled !== false) {
      const centerX = width / 2;
      const centerY = height / 2;
      
      const sizePercent = reticleConfig?.size || 20;
      const reticleSize = Math.ceil(minDimension * (sizePercent / 100) / 2);
      
      const opacity = reticleConfig?.opacity ? reticleConfig.opacity / 100 : 0.5;
      const greenColor = `rgba(34, 197, 94, ${opacity})`;
      
      const strokeWidthPercent = reticleConfig?.strokeWidth || 3;
      const scaledStrokeWidth = Math.max(1, Math.ceil(reticleSize * 2 * (strokeWidthPercent / 100)));
      
      ctx.strokeStyle = greenColor;
      ctx.lineWidth = scaledStrokeWidth;
      ctx.lineCap = "round";
      
      ctx.beginPath();
      ctx.moveTo(centerX - reticleSize, centerY);
      ctx.lineTo(centerX + reticleSize, centerY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - reticleSize);
      ctx.lineTo(centerX, centerY + reticleSize);
      ctx.stroke();
    }
    
    // Draw metadata only if enabled in reticle config
    if (reticleConfig?.showMetadata !== false) {
      const greenColor = "rgba(34, 197, 94, 0.9)";
      const dimColor = "rgba(107, 114, 128, 0.9)";
      const bgColor = "rgba(0, 0, 0, 0.6)";
      const separatorColor = "rgba(255, 255, 255, 0.1)";
      const boxPadding = Math.ceil(fontSize * 0.6);
      const boxRadius = Math.ceil(fontSize * 0.35);
      
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = "top";
      
      const hasLocation = metadata.latitude !== null && metadata.latitude !== undefined && 
                         metadata.longitude !== null && metadata.longitude !== undefined;
      const hasAltitude = metadata.altitude !== null && metadata.altitude !== undefined;
      const hasAccuracy = metadata.accuracy !== null && metadata.accuracy !== undefined;
      const hasHeading = metadata.heading !== null && metadata.heading !== undefined;
      const hasTilt = metadata.tilt !== null && metadata.tilt !== undefined;
      
      // LEFT PANEL - GPS Data
      const leftItems: { icon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => void; lines: string[]; hasData: boolean; separator?: boolean }[] = [];
      
      if (true) { // Always show coordinates section
        const coordLine = formatCoordinatesWithAccuracy(metadata.latitude ?? null, metadata.longitude ?? null, metadata.accuracy ?? null);
        leftItems.push({ icon: drawMapPinIcon, lines: [coordLine], hasData: hasLocation });
      }
      
      if (true) { // Always show altitude
        leftItems.push({ 
          icon: drawMountainIcon, 
          lines: [hasAltitude ? formatAltitude(metadata.altitude ?? null) : "--- m"], 
          hasData: hasAltitude,
          separator: true 
        });
      }
      
      if (true) { // Always show GPS accuracy
        leftItems.push({ 
          icon: drawSignalIcon, 
          lines: [`GPS: ${hasAccuracy ? formatAccuracy(metadata.accuracy ?? null) : "---"}`], 
          hasData: hasAccuracy || hasLocation 
        });
      }
      
      // Calculate left panel dimensions
      let maxLeftWidth = 0;
      for (const item of leftItems) {
        for (const line of item.lines) {
          const textWidth = ctx.measureText(line).width;
          maxLeftWidth = Math.max(maxLeftWidth, iconSize + iconGap + textWidth);
        }
      }
      
      let totalLeftHeight = boxPadding * 2;
      for (let i = 0; i < leftItems.length; i++) {
        totalLeftHeight += leftItems[i].lines.length * lineHeight;
        if (leftItems[i].separator && i < leftItems.length - 1) {
          totalLeftHeight += fontSize * 0.3; // separator space
        }
      }
      
      const leftBoxWidth = maxLeftWidth + boxPadding * 2;
      const leftBoxHeight = totalLeftHeight;
      
      // Draw left panel background
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      drawRoundedRectPath(ctx, padding, topOffset, leftBoxWidth, leftBoxHeight, boxRadius);
      ctx.fill();
      
      // Draw left panel content
      let yLeft = topOffset + boxPadding;
      for (let i = 0; i < leftItems.length; i++) {
        const item = leftItems[i];
        const iconColor = item.hasData ? greenColor : dimColor;
        
        // Draw separator line before item if needed
        if (item.separator && i > 0) {
          ctx.strokeStyle = separatorColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(padding + boxPadding, yLeft - fontSize * 0.15);
          ctx.lineTo(padding + leftBoxWidth - boxPadding, yLeft - fontSize * 0.15);
          ctx.stroke();
          yLeft += fontSize * 0.3;
        }
        
        // Draw icon
        item.icon(ctx, padding + boxPadding, yLeft, iconSize, iconColor);
        
        // Draw text lines
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        for (let j = 0; j < item.lines.length; j++) {
          ctx.fillText(item.lines[j], padding + boxPadding + iconSize + iconGap, yLeft + j * lineHeight);
        }
        yLeft += item.lines.length * lineHeight;
      }
      
      // RIGHT PANEL - Orientation Data
      const rightItems: { icon: (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => void; lines: string[]; hasData: boolean; separator?: boolean; cardinalDir?: string }[] = [];
      
      if (true) { // Always show heading
        const headingText = hasHeading ? formatHeading(metadata.heading ?? null) : "---°";
        const cardinal = hasHeading ? getCardinalDirection(metadata.heading ?? null) : "";
        rightItems.push({ 
          icon: drawCompassIcon, 
          lines: [headingText], 
          hasData: hasHeading,
          cardinalDir: cardinal
        });
      }
      
      if (true) { // Always show tilt
        rightItems.push({ 
          icon: drawTargetIcon, 
          lines: [`TILT: ${hasTilt ? formatTilt(metadata.tilt ?? null) : "---°"}`], 
          hasData: hasTilt,
          separator: true 
        });
      }
      
      // Calculate right panel dimensions
      let maxRightWidth = 0;
      for (const item of rightItems) {
        for (const line of item.lines) {
          let textWidth = ctx.measureText(line).width;
          if (item.cardinalDir) {
            textWidth += ctx.measureText(" " + item.cardinalDir).width;
          }
          maxRightWidth = Math.max(maxRightWidth, iconSize + iconGap + textWidth);
        }
      }
      
      let totalRightHeight = boxPadding * 2;
      for (let i = 0; i < rightItems.length; i++) {
        totalRightHeight += rightItems[i].lines.length * lineHeight;
        if (rightItems[i].separator && i < rightItems.length - 1) {
          totalRightHeight += fontSize * 0.3;
        }
      }
      
      const rightBoxWidth = maxRightWidth + boxPadding * 2;
      const rightBoxHeight = totalRightHeight;
      const rightX = width - padding - rightBoxWidth;
      
      // Draw right panel background
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      drawRoundedRectPath(ctx, rightX, topOffset, rightBoxWidth, rightBoxHeight, boxRadius);
      ctx.fill();
      
      // Draw right panel content
      let yRight = topOffset + boxPadding;
      for (let i = 0; i < rightItems.length; i++) {
        const item = rightItems[i];
        const iconColor = item.hasData ? greenColor : dimColor;
        
        // Draw separator line before item if needed
        if (item.separator && i > 0) {
          ctx.strokeStyle = separatorColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rightX + boxPadding, yRight - fontSize * 0.15);
          ctx.lineTo(rightX + rightBoxWidth - boxPadding, yRight - fontSize * 0.15);
          ctx.stroke();
          yRight += fontSize * 0.3;
        }
        
        // Draw icon
        item.icon(ctx, rightX + boxPadding, yRight, iconSize, iconColor);
        
        // Draw text
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        const textX = rightX + boxPadding + iconSize + iconGap;
        ctx.fillText(item.lines[0], textX, yRight);
        
        // Draw cardinal direction in green if exists
        if (item.cardinalDir) {
          const mainTextWidth = ctx.measureText(item.lines[0] + " ").width;
          ctx.fillStyle = greenColor;
          ctx.fillText(item.cardinalDir, textX + mainTextWidth, yRight);
        }
        
        yRight += item.lines.length * lineHeight;
      }
    }
    
    // NOTE - Bottom center with background box and icon
    if (metadata.note && metadata.note.trim()) {
      const noteFontSize = Math.ceil(fontSize * 0.9);
      const noteIconSize = Math.ceil(noteFontSize * 1.1);
      const noteIconGap = Math.ceil(noteFontSize * 0.4);
      const noteBoxPadding = Math.ceil(noteFontSize * 0.5);
      const noteRadius = Math.ceil(noteFontSize * 0.3);
      
      ctx.font = `${noteFontSize}px monospace`;
      const noteText = metadata.note.trim();
      const textMetrics = ctx.measureText(noteText);
      const noteBoxWidth = noteIconSize + noteIconGap + textMetrics.width + noteBoxPadding * 2;
      const noteBoxHeight = Math.max(noteIconSize, noteFontSize) + noteBoxPadding * 2;
      const noteX = (width - noteBoxWidth) / 2;
      const noteY = height - padding * 2 - noteBoxHeight;
      
      // Draw background box
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      drawRoundedRectPath(ctx, noteX, noteY, noteBoxWidth, noteBoxHeight, noteRadius);
      ctx.fill();
      
      // Draw file/note icon
      drawFileTextIcon(ctx, noteX + noteBoxPadding, noteY + noteBoxPadding, noteIconSize, "rgba(34, 197, 94, 0.9)");
      
      // Draw note text
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textBaseline = "top";
      ctx.fillText(noteText, noteX + noteBoxPadding + noteIconSize + noteIconGap, noteY + noteBoxPadding + (noteIconSize - noteFontSize) / 2);
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
