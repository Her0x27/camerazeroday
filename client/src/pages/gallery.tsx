import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Camera, ArrowLeft, Trash2, Filter, SortAsc, SortDesc, MapPin, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { getAllPhotos, deletePhoto, clearAllPhotos } from "@/lib/db";
import type { Photo, GalleryFilter } from "@shared/schema";

export default function GalleryPage() {
  const [, navigate] = useLocation();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<GalleryFilter>({ sortBy: "newest" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Load photos
  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      let allPhotos = await getAllPhotos(filter.sortBy);
      
      // Apply filters
      if (filter.hasLocation) {
        allPhotos = allPhotos.filter(p => p.metadata.latitude !== null);
      }
      if (filter.hasNote) {
        allPhotos = allPhotos.filter(p => p.note && p.note.trim().length > 0);
      }
      
      setPhotos(allPhotos);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Delete single photo
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    try {
      await deletePhoto(deleteTarget);
      setPhotos((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  // Clear all photos
  const handleClearAll = useCallback(async () => {
    try {
      await clearAllPhotos();
      setPhotos([]);
    } catch (error) {
      console.error("Clear error:", error);
    } finally {
      setShowClearDialog(false);
    }
  }, []);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      sortBy: prev.sortBy === "newest" ? "oldest" : "newest",
    }));
  }, []);

  // Format timestamp for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    
    // Less than 24 hours ago
    if (diff < 86400000) {
      return date.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
    
    // Less than 7 days ago
    if (diff < 604800000) {
      return date.toLocaleDateString("en-US", { 
        weekday: "short", 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    }
    
    // Older
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric" 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              data-testid="button-back-camera"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Gallery</h1>
              <p className="text-xs text-muted-foreground">
                {photos.length} {photos.length === 1 ? "photo" : "photos"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSortOrder}
              data-testid="button-sort-toggle"
            >
              {filter.sortBy === "newest" ? (
                <SortDesc className="w-5 h-5" />
              ) : (
                <SortAsc className="w-5 h-5" />
              )}
            </Button>

            {/* Filter menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-filter">
                  <Filter className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter Photos</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setFilter((prev) => ({ 
                    ...prev, 
                    hasLocation: prev.hasLocation ? undefined : true 
                  }))}
                  data-testid="filter-has-location"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Has Location
                  {filter.hasLocation && <span className="ml-auto text-primary">Active</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter((prev) => ({ 
                    ...prev, 
                    hasNote: prev.hasNote ? undefined : true 
                  }))}
                  data-testid="filter-has-note"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Has Note
                  {filter.hasNote && <span className="ml-auto text-primary">Active</span>}
                </DropdownMenuItem>
                {(filter.hasLocation || filter.hasNote) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setFilter({ sortBy: filter.sortBy })}
                      className="text-destructive"
                      data-testid="filter-clear"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear all menu */}
            {photos.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowClearDialog(true)}
                className="text-destructive hover:text-destructive"
                data-testid="button-clear-all"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Active filters */}
      {(filter.hasLocation || filter.hasNote) && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {filter.hasLocation && (
            <Badge variant="secondary" className="text-xs gap-1">
              <MapPin className="w-3 h-3" />
              Location
            </Badge>
          )}
          {filter.hasNote && (
            <Badge variant="secondary" className="text-xs gap-1">
              <FileText className="w-3 h-3" />
              Note
            </Badge>
          )}
        </div>
      )}

      {/* Content */}
      <main className="p-4 safe-bottom">
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-square bg-card animate-pulse rounded-md"
              />
            ))}
          </div>
        ) : photos.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No Photos Yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {filter.hasLocation || filter.hasNote
                ? "No photos match your current filters"
                : "Start capturing tactical photos with GPS coordinates and orientation data"
              }
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-start-capturing">
              <Camera className="w-4 h-4 mr-2" />
              Start Capturing
            </Button>
          </div>
        ) : (
          // Photo grid
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {photos.map((photo) => (
              <Card
                key={photo.id}
                className="group relative aspect-square overflow-hidden cursor-pointer hover-elevate"
                onClick={() => navigate(`/photo/${photo.id}`)}
                data-testid={`photo-card-${photo.id}`}
              >
                {/* Thumbnail */}
                <img
                  src={photo.thumbnailData}
                  alt="Photo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {photo.metadata.latitude !== null && (
                    <Badge 
                      variant="secondary" 
                      className="bg-black/60 text-white border-none text-[10px] px-1.5 py-0.5"
                    >
                      <MapPin className="w-2.5 h-2.5 mr-0.5" />
                      GPS
                    </Badge>
                  )}
                  {photo.note && (
                    <Badge 
                      variant="secondary" 
                      className="bg-black/60 text-white border-none text-[10px] px-1.5 py-0.5"
                    >
                      <FileText className="w-2.5 h-2.5" />
                    </Badge>
                  )}
                </div>

                {/* Timestamp */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <span className="font-mono text-[10px] text-white/90">
                    {formatDate(photo.metadata.timestamp)}
                  </span>
                </div>

                {/* Delete button (visible on hover) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(photo.id);
                  }}
                  data-testid={`button-delete-${photo.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The photo will be permanently removed from your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear all confirmation dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Photos?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {photos.length} photos from your device. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-clear"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
