import { MapPin, Compass, Mountain, Target, Signal } from "lucide-react";
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
}

export function MetadataOverlay({
  latitude,
  longitude,
  altitude,
  accuracy,
  heading,
  tilt,
  showMetadata,
}: MetadataOverlayProps) {
  if (!showMetadata) return null;

  const hasLocation = latitude !== null && longitude !== null;
  const hasOrientation = heading !== null;

  return (
    <>
      {/* Top-left: GPS data */}
      <div className="absolute top-4 left-4 safe-top">
        <div className="bg-black/60 backdrop-blur-sm rounded-md px-3 py-2 space-y-1">
          {/* Coordinates */}
          <div className="flex items-center gap-2">
            <MapPin className={`w-3.5 h-3.5 ${hasLocation ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-mono text-xs text-white/90 tracking-wide">
              <div>{formatCoordinate(latitude, "lat")}</div>
              <div>{formatCoordinate(longitude, "lon")}</div>
            </div>
          </div>
          
          {/* Altitude */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <Mountain className={`w-3.5 h-3.5 ${altitude !== null ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-mono text-xs text-white/90">{formatAltitude(altitude)}</span>
          </div>
          
          {/* GPS Accuracy */}
          <div className="flex items-center gap-2">
            <Signal className={`w-3.5 h-3.5 ${hasLocation ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-mono text-xs text-white/90">
              GPS: {formatAccuracy(accuracy)}
            </span>
          </div>
        </div>
      </div>

      {/* Top-right: Orientation data */}
      <div className="absolute top-4 right-4 safe-top">
        <div className="bg-black/60 backdrop-blur-sm rounded-md px-3 py-2 space-y-1">
          {/* Compass heading */}
          <div className="flex items-center gap-2">
            <Compass className={`w-3.5 h-3.5 ${hasOrientation ? "text-primary" : "text-muted-foreground"}`} />
            <div className="font-mono text-xs text-white/90 flex items-center gap-1.5">
              <span className="font-semibold">{formatHeading(heading)}</span>
              <span className="text-primary">{getCardinalDirection(heading)}</span>
            </div>
          </div>
          
          {/* Tilt */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <Target className={`w-3.5 h-3.5 ${tilt !== null ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-mono text-xs text-white/90">
              TILT: {tilt !== null ? `${tilt > 0 ? "+" : ""}${tilt}°` : "---°"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom center: Timestamp */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2">
        <div className="bg-black/40 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="font-mono text-[10px] text-white/70 tracking-wider">
            {new Date().toLocaleTimeString("en-US", { 
              hour12: false, 
              hour: "2-digit", 
              minute: "2-digit", 
              second: "2-digit" 
            })}
          </span>
        </div>
      </div>
    </>
  );
}

// Compact version for gallery/detail views
interface MetadataCompactProps {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  heading: number | null;
  timestamp: number;
  className?: string;
}

export function MetadataCompact({
  latitude,
  longitude,
  altitude,
  heading,
  timestamp,
  className = "",
}: MetadataCompactProps) {
  const hasLocation = latitude !== null && longitude !== null;
  const date = new Date(timestamp);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Timestamp */}
      <div className="text-sm text-muted-foreground">
        {date.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        {" at "}
        {date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>

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
