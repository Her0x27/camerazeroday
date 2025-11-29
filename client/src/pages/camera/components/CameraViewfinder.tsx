import { memo, RefObject } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reticle } from "@/components/reticles";
import { MetadataOverlay } from "@/components/metadata-overlay";
import type { ReticleConfig } from "@shared/schema";

interface CameraViewfinderProps {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  reticleConfig: ReticleConfig;
  reticleColor: string;
  geoData: {
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    accuracy: number | null;
    lastUpdate: number | null;
  };
  orientationData: {
    heading: number | null;
    tilt: number | null;
  };
  watermarkScale: number;
  accuracyLimit: number;
}

export const CameraViewfinder = memo(function CameraViewfinder({
  videoRef,
  canvasRef,
  isReady,
  isLoading,
  error,
  onRetry,
  reticleConfig,
  reticleColor,
  geoData,
  orientationData,
  watermarkScale,
  accuracyLimit,
}: CameraViewfinderProps) {
  return (
    <div className="relative flex-1 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        autoPlay
        muted
      />

      {isLoading && <LoadingOverlay />}
      {error && <ErrorOverlay error={error} onRetry={onRetry} />}

      <div className="absolute inset-0 viewfinder-overlay pointer-events-none" />

      {isReady && <Reticle config={reticleConfig} dynamicColor={reticleColor} />}

      {isReady && (
        <MetadataOverlay
          latitude={geoData.latitude}
          longitude={geoData.longitude}
          altitude={geoData.altitude}
          accuracy={geoData.accuracy}
          heading={orientationData.heading}
          tilt={orientationData.tilt}
          showMetadata={reticleConfig.showMetadata}
          lastUpdate={geoData.lastUpdate ?? undefined}
          scale={watermarkScale}
          accuracyLimit={accuracyLimit}
        />
      )}
    </div>
  );
});

const LoadingOverlay = memo(function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
      <div className="flex flex-col items-center gap-3">
        <Camera className="w-12 h-12 text-primary animate-pulse" />
        <span className="text-sm text-white/70">Starting camera...</span>
      </div>
    </div>
  );
});

interface ErrorOverlayProps {
  error: string;
  onRetry: () => void;
}

const ErrorOverlay = memo(function ErrorOverlay({ error, onRetry }: ErrorOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <Camera className="w-12 h-12 text-destructive" />
        <span className="text-sm text-white">{error}</span>
        <Button onClick={onRetry} variant="outline" size="sm" data-testid="button-retry-camera">
          Retry
        </Button>
      </div>
    </div>
  );
});
