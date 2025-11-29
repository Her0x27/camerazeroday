import { useState, useEffect, useCallback, useRef } from "react";

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
}

interface UseGeolocationReturn {
  data: GeolocationData;
  isLoading: boolean;
  error: string | null;
  isWatching: boolean;
  startWatching: () => void;
  stopWatching: () => void;
  getCurrentPosition: () => Promise<GeolocationData>;
}

const defaultData: GeolocationData = {
  latitude: null,
  longitude: null,
  altitude: null,
  accuracy: null,
  timestamp: Date.now(),
};

export function useGeolocation(enabled: boolean = true): UseGeolocationReturn {
  const [data, setData] = useState<GeolocationData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setData({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude,
      accuracy: position.coords.accuracy,
      timestamp: position.timestamp,
    });
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage: string;
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = "Location access denied";
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable";
        break;
      case err.TIMEOUT:
        errorMessage = "Location request timeout";
        break;
      default:
        errorMessage = "Unknown location error";
    }
    setError(errorMessage);
    setIsLoading(false);
  }, []);

  const positionOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 300000,
    maximumAge: 0,
  };

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || !enabled) {
      setError("Geolocation not supported");
      return;
    }

    if (watchIdRef.current !== null || intervalIdRef.current !== null) return;

    setIsLoading(true);
    setIsWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      positionOptions
    );

    intervalIdRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        positionOptions
      );
    }, 1000);
  }, [enabled, handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const getCurrentPosition = useCallback((): Promise<GeolocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoData: GeolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          setData(geoData);
          resolve(geoData);
        },
        (err) => {
          handleError(err);
          reject(err);
        },
        positionOptions
      );
    });
  }, [handleError]);

  // Auto-start watching if enabled
  useEffect(() => {
    if (enabled) {
      startWatching();
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [enabled, startWatching, stopWatching]);

  return {
    data,
    isLoading,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
}

// Format coordinates for display in decimal degrees format
export function formatCoordinate(value: number | null, type: "lat" | "lon"): string {
  if (value === null) return "---°--'--\"";
  
  const formatted = value.toFixed(5);
  const sign = value >= 0 ? "+" : "";
  
  return `${sign}${formatted}`;
}

// Format coordinates with accuracy
export function formatCoordinatesWithAccuracy(latitude: number | null, longitude: number | null, accuracy: number | null): string {
  if (latitude === null || longitude === null) {
    return "---.------- ---.------- (±--m)";
  }
  
  const latFormatted = Math.abs(latitude).toFixed(7);
  const lonFormatted = Math.abs(longitude).toFixed(7);
  const accuracyFormatted = accuracy !== null ? Math.round(accuracy) : "--";
  
  return `${latFormatted} ${lonFormatted} (±${accuracyFormatted}m)`;
}


// Format altitude for display with precision
export function formatAltitude(altitude: number | null): string {
  if (altitude === null) return "--- m";
  return `${altitude.toFixed(1)} m`;
}

// Format accuracy for display
export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return "---";
  if (accuracy < 10) return "HIGH";
  if (accuracy < 50) return "MED";
  return "LOW";
}
