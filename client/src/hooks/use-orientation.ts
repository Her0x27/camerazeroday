import { useState, useEffect, useCallback, useRef } from "react";

interface OrientationData {
  heading: number | null; // compass heading (alpha) in degrees 0-360
  tilt: number | null; // front-back tilt (beta) -180 to 180
  roll: number | null; // left-right tilt (gamma) -90 to 90
}

interface UseOrientationReturn {
  data: OrientationData;
  isSupported: boolean;
  isPermissionGranted: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
}

const defaultData: OrientationData = {
  heading: null,
  tilt: null,
  roll: null,
};

export function useOrientation(enabled: boolean = true): UseOrientationReturn {
  const [data, setData] = useState<OrientationData>(defaultData);
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenerRef = useRef<((event: DeviceOrientationEvent) => void) | null>(null);

  // Check if device orientation is supported
  useEffect(() => {
    const supported = "DeviceOrientationEvent" in window;
    setIsSupported(supported);
    
    if (!supported) {
      setError("Device orientation not supported");
    }
  }, []);

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // Handle different browser implementations
    let heading = event.alpha;
    
    // For iOS, we need to handle webkitCompassHeading
    if ((event as any).webkitCompassHeading !== undefined) {
      heading = (event as any).webkitCompassHeading;
    } else if (heading !== null) {
      // Normalize alpha to compass heading (0 = North)
      heading = (360 - heading) % 360;
    }

    setData({
      heading: heading !== null ? Math.round(heading) : null,
      tilt: event.beta !== null ? Math.round(event.beta) : null,
      roll: event.gamma !== null ? Math.round(event.gamma) : null,
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Device orientation not supported");
      return false;
    }

    try {
      // iOS 13+ requires permission
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === "granted") {
          setIsPermissionGranted(true);
          setError(null);
          return true;
        } else {
          setError("Orientation permission denied");
          return false;
        }
      } else {
        // Android and older iOS don't require permission
        setIsPermissionGranted(true);
        setError(null);
        return true;
      }
    } catch (err) {
      setError("Failed to request orientation permission");
      return false;
    }
  }, [isSupported]);

  // Add/remove event listener
  useEffect(() => {
    if (!enabled || !isSupported) return;

    // Try to add listener (will work on Android, may need permission on iOS)
    const listener = (event: DeviceOrientationEvent) => {
      // If we get events, permission is granted
      if (!isPermissionGranted) {
        setIsPermissionGranted(true);
      }
      handleOrientation(event);
    };

    listenerRef.current = listener;
    window.addEventListener("deviceorientation", listener, true);

    return () => {
      if (listenerRef.current) {
        window.removeEventListener("deviceorientation", listenerRef.current, true);
      }
    };
  }, [enabled, isSupported, isPermissionGranted, handleOrientation]);

  return {
    data,
    isSupported,
    isPermissionGranted,
    error,
    requestPermission,
  };
}

// Format heading for display
export function formatHeading(heading: number | null): string {
  if (heading === null) return "---°";
  return `${heading.toString().padStart(3, "0")}°`;
}

// Get cardinal direction from heading
export function getCardinalDirection(heading: number | null): string {
  if (heading === null) return "--";
  
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

// Format tilt for display
export function formatTilt(tilt: number | null): string {
  if (tilt === null) return "---°";
  const sign = tilt >= 0 ? "+" : "";
  return `${sign}${tilt}°`;
}
