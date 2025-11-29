import { useCallback, useState } from "react";
import { deletePhoto, updatePhoto, clearAllPhotos } from "@/lib/db";
import { uploadToImgBB } from "@/lib/imgbb";
import type { Photo, CloudData } from "@shared/schema";

export interface MutationResult<T = void> {
  success: boolean;
  data?: T;
  error?: Error;
}

export interface UsePhotoMutationsResult {
  deletePhotoById: (id: string) => Promise<MutationResult>;
  updatePhotoById: (id: string, updates: Partial<Photo>) => Promise<MutationResult<Photo>>;
  uploadPhotoToCloud: (photo: Photo, apiKey: string, expiration?: number) => Promise<MutationResult<CloudData>>;
  clearAll: () => Promise<MutationResult>;
  isDeleting: boolean;
  isUpdating: boolean;
  isUploading: boolean;
  lastError: Error | null;
}

export function usePhotoMutations(): UsePhotoMutationsResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const deletePhotoById = useCallback(async (id: string): Promise<MutationResult> => {
    setIsDeleting(true);
    setLastError(null);
    
    try {
      await deletePhoto(id);
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete photo");
      setLastError(error);
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const updatePhotoById = useCallback(async (id: string, updates: Partial<Photo>): Promise<MutationResult<Photo>> => {
    setIsUpdating(true);
    setLastError(null);
    
    try {
      const updated = await updatePhoto(id, updates);
      if (updated) {
        return { success: true, data: updated };
      }
      return { success: false, error: new Error("Photo not found") };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update photo");
      setLastError(error);
      return { success: false, error };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const uploadPhotoToCloud = useCallback(async (
    photo: Photo,
    apiKey: string,
    expiration: number = 0
  ): Promise<MutationResult<CloudData>> => {
    setIsUploading(true);
    setLastError(null);
    
    try {
      const result = await uploadToImgBB(photo.imageData, apiKey, expiration);
      
      if (result.success && result.cloudData) {
        await updatePhoto(photo.id, { cloud: result.cloudData });
        return { success: true, data: result.cloudData };
      }
      
      const error = new Error(result.error || "Upload failed");
      setLastError(error);
      return { success: false, error };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to upload photo");
      setLastError(error);
      return { success: false, error };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearAll = useCallback(async (): Promise<MutationResult> => {
    setIsDeleting(true);
    setLastError(null);
    
    try {
      await clearAllPhotos();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to clear photos");
      setLastError(error);
      return { success: false, error };
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    deletePhotoById,
    updatePhotoById,
    uploadPhotoToCloud,
    clearAll,
    isDeleting,
    isUpdating,
    isUploading,
    lastError,
  };
}
