import { memo, useState, useEffect } from "react";
import { MapPin, Compass, Mountain, Target, Signal, Clock } from "lucide-react";
import { formatCoordinate, formatAltitude, formatAccuracy } from "@/hooks/use-geolocation";
import { formatHeading, getCardinalDirection } from "@/hooks/use-orientation";

interface MetadataOverlayProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  tilt: number | null;
  showMetadata: boolean;
  lastUpdate?: number;
}

function formatLastUpdate(lastUpdate: number | undefined): string {
  if (!lastUpdate) return "---";
  const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
  if (seconds < 1) return "LIVE";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m`;
}

export const MetadataOverlay = memo(function MetadataOverlay({
  latitude,
  longitude,
  altitude,
  accuracy,
  heading,
  tilt,
  showMetadata,
  lastUpdate,
}: MetadataOverlayProps) {
  const [, forceUpdate] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!showMetadata) return null;

  const hasLocation = latitude !== null && longitude !== null;
  const hasOrientation = heading !== null;
  const updateAge = lastUpdate ? (Date.now() - lastUpdate) / 1000 : Infinity;
  const isLive = updateAge < 2;

  return (
    <>
      <div className="absolute top-16 left-4 z-5">
        <div className="bg-black/60 backdrop-blur-sm rounded-md px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <MapPin className={`w-3.5 h-3.5 ${hasLocation ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-mono text-xs text-white/90 tracking-wide">
              <div>{formatCoordinate(latitude, "lat")}</div>
              <div>{formatCoordinate(longitude, "lon")}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <Mountain className={`w-3.5 h-3.5 ${altitude !== null ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-mono text-xs text-white/90">{formatAltitude(altitude)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Signal className={`w-3.5 h-3.5 ${hasLocation ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-mono text-xs text-white/90">
              GPS: {formatAccuracy(accuracy)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className={`w-3.5 h-3.5 ${isLive ? "text-green-400" : "text-amber-400"}`} />
            <span className={`font-mono text-xs ${isLive ? "text-green-400" : "text-amber-400"}`}>
              {formatLastUpdate(lastUpdate)}
            </span>
            {isLive && (
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-16 right-4 z-5">
        <div className="bg-black/60 backdrop-blur-sm rounded-md px-3 py-2 space-y-1">
          <div className="flex items-center gap-2">
            <Compass className={`w-3.5 h-3.5 ${hasOrientation ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-mono text-xs text-white/90 flex items-center gap-1.5">
              <span className="font-semibold">{formatHeading(heading)}</span>
              <span className="text-primary">{getCardinalDirection(heading)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <Target className={`w-3.5 h-3.5 ${tilt !== null ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-mono text-xs text-white/90">
              TILT: {tilt !== null ? `${tilt > 0 ? "+" : ""}${tilt}°` : "---°"}
            </span>
          </div>
        </div>
      </div>

    </>
  );
});

// Compact version for gallery/detail views
interface MetadataCompactProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  heading: number | null;
  className?: string;
}

export function MetadataCompact({
  latitude,
  longitude,
  altitude,
  heading,
  className = "",
}: MetadataCompactProps) {
  const hasLocation = latitude !== null && longitude !== null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Location */}
      <div className="flex items-start gap-3">
        <MapPin className={`w-4 h-4 mt-0.5 ${hasLocation ? "text-primary" : "text-muted-foreground"}`} />
        <div>
          <div className="font-mono text-sm">
            {hasLocation ? (
              <>
                <div>{formatCoordinate(latitude, "lat")}</div>
                <div>{formatCoordinate(longitude, "lon")}</div>
              </>
            ) : (
              <span className="text-muted-foreground">Location not available</span>
            )}
          </div>
        </div>
      </div>

      {/* Altitude */}
      <div className="flex items-center gap-3">
        <Mountain className={`w-4 h-4 ${altitude !== null ? "text-primary" : "text-muted-foreground"}`} />
        <span className="font-mono text-sm">{formatAltitude(altitude)}</span>
      </div>

      {/* Heading */}
      <div className="flex items-center gap-3">
        <Compass className={`w-4 h-4 ${heading !== null ? "text-primary" : "text-muted-foreground"}`} />
        <span className="font-mono text-sm">
          {heading !== null ? (
            <>
              {formatHeading(heading)} ({getCardinalDirection(heading)})
            </>
          ) : (
            <span className="text-muted-foreground">Heading not available</span>
          )}
        </span>
      </div>
    </div>
  );
}
