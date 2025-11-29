import { useState, useCallback } from "react";

export interface UploadProgress {
  completed: number;
  total: number;
}

export interface UseUploadProgressResult {
  isUploading: boolean;
  progress: UploadProgress;
  startUpload: (total: number) => void;
  updateProgress: (completed: number, total: number) => void;
  finishUpload: () => void;
  resetProgress: () => void;
}

const initialProgress: UploadProgress = { completed: 0, total: 0 };

export function useUploadProgress(): UseUploadProgressResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>(initialProgress);

  const startUpload = useCallback((total: number) => {
    setIsUploading(true);
    setProgress({ completed: 0, total });
  }, []);

  const updateProgress = useCallback((completed: number, total: number) => {
    setProgress({ completed, total });
  }, []);

  const finishUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(initialProgress);
  }, []);

  const resetProgress = useCallback(() => {
    setIsUploading(false);
    setProgress(initialProgress);
  }, []);

  return {
    isUploading,
    progress,
    startUpload,
    updateProgress,
    finishUpload,
    resetProgress,
  };
}
