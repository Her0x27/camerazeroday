import { useState, useEffect, useCallback } from "react";
import { getStorageEstimate, getPhotoCount, clearAllPhotos } from "@/lib/db";

export interface StorageInfo {
  used: number;
  quota: number;
  photos: number;
}

export interface UseStorageResult {
  storageInfo: StorageInfo | null;
  isLoading: boolean;
  isSupported: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  clearStorage: () => Promise<boolean>;
}

export function useStorage(): UseStorageResult {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadStorageInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [estimate, count] = await Promise.all([
        getStorageEstimate(),
        getPhotoCount(),
      ]);

      if (estimate) {
        setStorageInfo({
          used: estimate.used,
          quota: estimate.quota,
          photos: count,
        });
        setIsSupported(true);
      } else {
        setStorageInfo({
          used: 0,
          quota: 0,
          photos: count,
        });
        setIsSupported(false);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to load storage info");
      setError(error);
      console.error("Failed to load storage info:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearStorage = useCallback(async (): Promise<boolean> => {
    try {
      await clearAllPhotos();
      setStorageInfo((prev) => prev ? { ...prev, photos: 0, used: 0 } : null);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to clear storage");
      setError(error);
      return false;
    }
  }, []);

  useEffect(() => {
    loadStorageInfo();
  }, [loadStorageInfo]);

  return {
    storageInfo,
    isLoading,
    isSupported,
    error,
    refresh: loadStorageInfo,
    clearStorage,
  };
}
