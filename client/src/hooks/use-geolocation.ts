import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface GeolocationData {
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  accuracy: number | null;
  timestamp: number;
  lastUpdate: number;
  isAcquiring: boolean;
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
  lastUpdate: Date.now(),
  isAcquiring: true,
};

const ACCURACY_THRESHOLD = 100;

export function useGeolocation(enabled: boolean = true): UseGeolocationReturn {
  const [data, setData] = useState<GeolocationData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const bestAccuracyRef = useRef<number>(Infinity);

  const positionOptions: PositionOptions = useMemo(() => ({
    enableHighAccuracy: true,
    timeout: 30000,
    maximumAge: 0,
  }), []);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    const newAccuracy = position.coords.accuracy;
    
    const isBetterFix = newAccuracy < bestAccuracyRef.current;
    const isGoodEnough = newAccuracy <= ACCURACY_THRESHOLD;
    const hasNoData = data.latitude === null;
    
    if (isBetterFix || hasNoData) {
      bestAccuracyRef.current = Math.min(bestAccuracyRef.current, newAccuracy);
      
      setData({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: newAccuracy,
        timestamp: position.timestamp,
        lastUpdate: now,
        isAcquiring: !isGoodEnough,
      });
    } else if (isGoodEnough) {
      setData(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: newAccuracy,
        timestamp: position.timestamp,
        lastUpdate: now,
        isAcquiring: false,
      }));
    } else {
      setData(prev => ({
        ...prev,
        lastUpdate: now,
      }));
    }
    
    setError(null);
    setIsLoading(false);
  }, [data.latitude]);

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

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || !enabled) {
      setError("Geolocation not supported");
      return;
    }

    if (watchIdRef.current !== null) return;

    setIsLoading(true);
    setIsWatching(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      positionOptions
    );
    
    bestAccuracyRef.current = Infinity;
  }, [enabled, handleSuccess, handleError, positionOptions]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
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
          const now = Date.now();
          const geoData: GeolocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            lastUpdate: now,
            isAcquiring: position.coords.accuracy > ACCURACY_THRESHOLD,
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
  }, [handleError, positionOptions]);

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

// Format accuracy for display with meters
export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return "--- m";
  return `±${Math.round(accuracy)} m`;
}

// Get accuracy quality level
export function getAccuracyLevel(accuracy: number | null): "high" | "medium" | "low" | "none" {
  if (accuracy === null) return "none";
  if (accuracy < 10) return "high";
  if (accuracy < 50) return "medium";
  return "low";
}
