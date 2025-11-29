import { useState, useEffect, useCallback } from "react";
import { useLocation, useRoute } from "wouter";
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Edit2,
  X,
  Check,
  Share2,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { MetadataCompact } from "@/components/metadata-overlay";
import { getPhoto, getAllPhotos, updatePhoto, deletePhoto, createCleanImageBlob } from "@/lib/db";
import type { Photo } from "@shared/schema";

export default function PhotoDetailPage() {
  const [, params] = useRoute("/photo/:id");
  const [, navigate] = useLocation();
  
  const photoId = params?.id;
  
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [allPhotoIds, setAllPhotoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          setEditedNote(loadedPhoto.note || "");
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
      if (isEditingNote) return;
      
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
  }, [goToPrevious, goToNext, navigate, isEditingNote]);

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

  // Save edited note
  const handleSaveNote = useCallback(async () => {
    if (!photoId) return;
    
    try {
      const updatedNote = editedNote.trim() || undefined;
      await updatePhoto(photoId, { note: updatedNote });
      setPhoto((prev) => prev ? { ...prev, note: updatedNote } : null);
      setIsEditingNote(false);
    } catch (error) {
      console.error("Save error:", error);
    }
  }, [photoId, editedNote]);

  // Cancel note editing
  const handleCancelEdit = useCallback(() => {
    setEditedNote(photo?.note || "");
    setIsEditingNote(false);
  }, [photo?.note]);

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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/gallery")}
            data-testid="button-back-gallery"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {allPhotoIds.length}
          </div>

          <div className="flex items-center gap-1">
            {navigator.share && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExport}
              data-testid="button-export"
            >
              <Download className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive hover:text-destructive"
              data-testid="button-delete"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Photo display - fullscreen mode takes entire screen */}
      <div 
        className={`relative flex items-center justify-center bg-black cursor-pointer ${
          isFullscreen ? "fixed inset-0 z-50" : "flex-1 min-h-[50vh]"
        }`}
        onClick={() => setIsFullscreen(!isFullscreen)}
      >
        <img
          src={photo.imageData}
          alt="Photo"
          className={`object-contain ${
            isFullscreen 
              ? "w-full h-full" 
              : "w-full h-full max-h-[70vh]"
          }`}
          data-testid="photo-image"
        />

        {/* Fullscreen toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute bg-black/40 text-white hover:bg-black/60 ${
            isFullscreen ? "top-4 right-4" : "bottom-4 right-4"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsFullscreen(!isFullscreen);
          }}
          data-testid="button-fullscreen-toggle"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </Button>

        {/* Navigation arrows */}
        {hasPrevious && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            data-testid="button-previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        )}

        {hasNext && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 text-white hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            data-testid="button-next"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        )}

        {/* Close button in fullscreen mode */}
        {isFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-black/40 text-white hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            data-testid="button-close-fullscreen"
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        {/* Photo counter in fullscreen */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {allPhotoIds.length}
          </div>
        )}
      </div>

      {/* Metadata panel - hidden in fullscreen */}
      {!isFullscreen && (
        <div className="bg-card border-t border-border p-4 safe-bottom space-y-4">
          <MetadataCompact
            latitude={photo.metadata.latitude}
            longitude={photo.metadata.longitude}
            altitude={photo.metadata.altitude}
            heading={photo.metadata.heading}
          />

          {/* Note section */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Note</span>
              </div>
              
              {isEditingNote ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel-edit"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-primary"
                    onClick={handleSaveNote}
                    data-testid="button-save-edit"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setIsEditingNote(true)}
                  data-testid="button-edit-note"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {isEditingNote ? (
              <Textarea
                value={editedNote}
                onChange={(e) => setEditedNote(e.target.value)}
                placeholder="Add a note..."
                className="min-h-[80px] resize-none"
                autoFocus
                data-testid="input-edit-note"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {photo.note || "No note added"}
              </p>
            )}
          </Card>
        </div>
      )}

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
