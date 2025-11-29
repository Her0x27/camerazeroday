import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPhoto, getAllPhotos, deletePhoto, createCleanImageBlob } from "@/lib/db";
import type { Photo } from "@shared/schema";

export default function PhotoDetailPage() {
  const [, params] = useRoute("/photo/:id");
  const [, navigate] = useLocation();
  
  const photoId = params?.id;
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [allPhotoIds, setAllPhotoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Load photo and all photo IDs for navigation
  useEffect(() => {
    const loadPhoto = async () => {
      if (!photoId) return;
      
      setIsLoading(true);
      try {
        const [loadedPhoto, photos] = await Promise.all([
          getPhoto(photoId),
          getAllPhotos("newest"),
        ]);
        
        if (loadedPhoto) {
          setPhoto(loadedPhoto);
        }
        
        setAllPhotoIds(photos.map((p) => p.id));
      } catch (error) {
        console.error("Load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhoto();
  }, [photoId]);

  // Get current index and navigation
  const currentIndex = photoId ? allPhotoIds.indexOf(photoId) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allPhotoIds.length - 1;

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      navigate(`/photo/${allPhotoIds[currentIndex - 1]}`);
    }
  }, [hasPrevious, allPhotoIds, currentIndex, navigate]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      navigate(`/photo/${allPhotoIds[currentIndex + 1]}`);
    }
  }, [hasNext, allPhotoIds, currentIndex, navigate]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        navigate("/gallery");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext, navigate]);

  // Delete photo
  const handleDelete = useCallback(async () => {
    if (!photoId) return;
    
    try {
      await deletePhoto(photoId);
      
      // Navigate to next photo or gallery
      if (hasNext) {
        navigate(`/photo/${allPhotoIds[currentIndex + 1]}`);
      } else if (hasPrevious) {
        navigate(`/photo/${allPhotoIds[currentIndex - 1]}`);
      } else {
        navigate("/gallery");
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  }, [photoId, hasNext, hasPrevious, allPhotoIds, currentIndex, navigate]);

  // Export photo (download without EXIF)
  const handleExport = useCallback(async () => {
    if (!photo) return;
    
    try {
      const blob = await createCleanImageBlob(photo.imageData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zeroday-${new Date(photo.metadata.timestamp).toISOString().slice(0, 10)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
    }
  }, [photo]);

  // Share photo
  const handleShare = useCallback(async () => {
    if (!photo || !navigator.share) return;
    
    try {
      const blob = await createCleanImageBlob(photo.imageData);
      const file = new File([blob], `zeroday-photo.jpg`, { type: "image/jpeg" });
      
      await navigator.share({
        files: [file],
        title: "Camera ZeroDay Photo",
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share error:", error);
      }
    }
  }, [photo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-lg font-semibold mb-2">Photo Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This photo may have been deleted
        </p>
        <Button onClick={() => navigate("/gallery")} data-testid="button-back-to-gallery">
          Back to Gallery
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Fullscreen photo display */}
      <img
        src={photo.imageData}
        alt="Photo"
        className="w-full h-full object-cover"
        data-testid="photo-image"
      />

      {/* Navigation arrows */}
      {hasPrevious && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white hover:bg-black/60 z-40"
          onClick={goToPrevious}
          data-testid="button-previous"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white hover:bg-black/60 z-40"
          onClick={goToNext}
          data-testid="button-next"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      <header className="absolute bottom-0 left-0 right-0 z-50 bg-transparent">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/gallery")}
            className="text-white hover:bg-white/20"
            data-testid="button-back-gallery"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-sm text-white/80">
            {currentIndex + 1} / {allPhotoIds.length}
          </div>

          <div className="flex items-center gap-1">
            {typeof navigator.share === "function" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              className="text-white hover:bg-white/20"
              data-testid="button-export"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-400 hover:bg-white/20 hover:text-red-400"
              data-testid="button-delete"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The photo will be permanently removed from your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-dialog">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-dialog"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
