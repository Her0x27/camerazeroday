import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { getAllPhotos, updatePhoto } from "@/lib/db";
import { uploadMultipleToImgBB } from "@/lib/imgbb";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { usePhotoMutations } from "@/hooks/use-photo-mutations";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useI18n } from "@/lib/i18n";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { UploadProgressOverlay } from "@/components/upload-progress-overlay";
import { VirtualizedPhotoList, VirtualizedPhotoGrid, AutoSizerContainer } from "@/components/virtualized-gallery";
import {
  GalleryHeader,
  GalleryFilters,
  GalleryEmptyState,
  GalleryFolderList,
  GalleryLinksDialog,
  type FolderInfo,
} from "./components";
import type { Photo, GalleryFilter } from "@shared/schema";

type ViewMode = "folders" | "photos";
type DisplayType = "list" | "grid";

interface LinkItem {
  id: string;
  url: string;
  deleteUrl: string;
}

export default function GalleryPage() {
  const [, navigate] = useLocation();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { t } = useI18n();
  const { deletePhotoById, clearAll } = usePhotoMutations();
  const { isUploading, progress: uploadProgress, startUpload, updateProgress, finishUpload } = useUploadProgress();
  
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<GalleryFilter>({ sortBy: "newest" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("folders");
  const [selectedFolder, setSelectedFolder] = useState<string | null | undefined>(undefined);
  const [displayType, setDisplayType] = useState<DisplayType>("list");
  
  const [showLinksDialog, setShowLinksDialog] = useState(false);
  const [linksToShow, setLinksToShow] = useState<LinkItem[]>([]);
  
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  const folders = useMemo((): FolderInfo[] => {
    const folderMap = new Map<string | null, { count: number; latestThumb: string | null; latestTimestamp: number }>();
    
    for (const photo of allPhotos) {
      const folderName = photo.folder || null;
      const existing = folderMap.get(folderName);
      
      if (!existing) {
        folderMap.set(folderName, {
          count: 1,
          latestThumb: photo.thumbnailData,
          latestTimestamp: photo.metadata.timestamp,
        });
      } else {
        existing.count++;
        if (photo.metadata.timestamp > existing.latestTimestamp) {
          existing.latestThumb = photo.thumbnailData;
          existing.latestTimestamp = photo.metadata.timestamp;
        }
      }
    }
    
    const result: FolderInfo[] = [];
    folderMap.forEach((value, key) => {
      result.push({ name: key, count: value.count, latestThumb: value.latestThumb });
    });
    
    return result.sort((a, b) => {
      if (a.name === null) return 1;
      if (b.name === null) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [allPhotos]);

  const displayPhotos = useMemo(() => {
    if (selectedFolder === undefined) {
      return allPhotos;
    }
    return allPhotos.filter(p => (p.folder || null) === selectedFolder);
  }, [allPhotos, selectedFolder]);

  const filteredPhotos = useMemo(() => {
    let result = displayPhotos;
    if (filter.hasLocation) {
      result = result.filter(p => p.metadata.latitude !== null);
    }
    if (filter.hasNote) {
      result = result.filter(p => p.note && p.note.trim().length > 0);
    }
    return result;
  }, [displayPhotos, filter.hasLocation, filter.hasNote]);

  const loadPhotos = useCallback(async () => {
    setIsLoading(true);
    try {
      const photos = await getAllPhotos(filter.sortBy);
      setAllPhotos(photos);
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filter.sortBy]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleFolderSelect = useCallback((folderName: string | null) => {
    setSelectedFolder(folderName);
    setViewMode("photos");
  }, []);

  const handleBackToFolders = useCallback(() => {
    setSelectedFolder(undefined);
    setViewMode("folders");
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    const result = await deletePhotoById(deleteTarget);
    if (result.success) {
      setAllPhotos((prev) => prev.filter((p) => p.id !== deleteTarget));
    } else {
      console.error("Delete error:", result.error);
    }
    setDeleteTarget(null);
  }, [deleteTarget, deletePhotoById]);

  const handleClearAll = useCallback(async () => {
    const result = await clearAll();
    if (result.success) {
      setAllPhotos([]);
      setSelectedFolder(undefined);
      setViewMode("folders");
    } else {
      console.error("Clear error:", result.error);
    }
    setShowClearDialog(false);
  }, [clearAll]);

  useEffect(() => {
    return () => {
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort();
        uploadAbortControllerRef.current = null;
      }
    };
  }, []);

  const handleUploadPhotos = useCallback(async (photos: Photo[]) => {
    if (!settings.imgbb?.apiKey || !settings.imgbb.isValidated) {
      toast({
        title: t.common.error,
        description: t.gallery.configureApiFirst,
        variant: "destructive",
      });
      return;
    }

    const photosToUpload = photos.filter(p => !p.cloud);
    if (photosToUpload.length === 0) {
      toast({
        title: t.common.info,
        description: t.gallery.allUploaded,
      });
      return;
    }

    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
    }
    uploadAbortControllerRef.current = new AbortController();

    startUpload(photosToUpload.length);

    try {
      const results = await uploadMultipleToImgBB(
        photosToUpload.map(p => ({ id: p.id, imageData: p.imageData })),
        settings.imgbb.apiKey,
        settings.imgbb.expiration || 0,
        updateProgress,
        3,
        uploadAbortControllerRef.current.signal
      );

      let successCount = 0;
      let errorCount = 0;
      let cancelledCount = 0;

      for (const [photoId, result] of Array.from(results.entries())) {
        if (result.error === "Upload cancelled") {
          cancelledCount++;
        } else if (result.success && result.cloudData) {
          await updatePhoto(photoId, { cloud: result.cloudData });
          setAllPhotos(prev => 
            prev.map(p => p.id === photoId ? { ...p, cloud: result.cloudData } : p)
          );
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (cancelledCount > 0) {
        toast({
          title: t.common.info,
          description: t.gallery.uploadCancelledPartial.replace("{count}", String(successCount)),
        });
      } else {
        toast({
          title: t.gallery.uploadComplete,
          description: t.gallery.uploadedCount.replace("{success}", String(successCount)).replace("{errors}", String(errorCount)),
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: t.common.info,
          description: t.gallery.uploadCancelled,
        });
      } else {
        toast({
          title: t.common.error,
          description: error instanceof Error ? error.message : t.common.unknownError,
          variant: "destructive",
        });
      }
    } finally {
      uploadAbortControllerRef.current = null;
      finishUpload();
    }
  }, [settings.imgbb, toast, t, startUpload, updateProgress, finishUpload]);

  const handleUploadCurrentView = useCallback(async () => {
    const photosToUpload = viewMode === "photos" ? filteredPhotos : allPhotos;
    await handleUploadPhotos(photosToUpload);
  }, [viewMode, filteredPhotos, allPhotos, handleUploadPhotos]);

  const handleGetLinks = useCallback(() => {
    const photosWithLinks = (viewMode === "photos" ? filteredPhotos : allPhotos)
      .filter(p => p.cloud?.url);
    
    if (photosWithLinks.length === 0) {
      toast({
        title: t.gallery.noLinks,
        description: t.gallery.uploadFirst,
      });
      return;
    }

    setLinksToShow(
      photosWithLinks.map(p => ({
        id: p.id,
        url: p.cloud!.url,
        deleteUrl: p.cloud!.deleteUrl,
      }))
    );
    setShowLinksDialog(true);
  }, [viewMode, filteredPhotos, allPhotos, toast, t]);

  const handleCopyAllLinks = useCallback(async () => {
    const allLinks = linksToShow.map(l => l.url).join("\n");
    try {
      await navigator.clipboard.writeText(allLinks);
      toast({
        title: t.gallery.copied,
        description: t.gallery.linksCopied.replace("{count}", String(linksToShow.length)),
      });
    } catch {
      toast({
        title: t.common.error,
        description: t.gallery.copyFailed,
        variant: "destructive",
      });
    }
  }, [linksToShow, toast, t]);

  const uploadedCount = useMemo(() => {
    const photos = viewMode === "photos" ? filteredPhotos : allPhotos;
    return photos.filter(p => p.cloud?.url).length;
  }, [viewMode, filteredPhotos, allPhotos]);

  const toggleSortOrder = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      sortBy: prev.sortBy === "newest" ? "oldest" : "newest",
    }));
  }, []);

  const toggleLocationFilter = useCallback(() => {
    setFilter((prev) => ({ 
      ...prev, 
      hasLocation: prev.hasLocation ? undefined : true 
    }));
  }, []);

  const toggleNoteFilter = useCallback(() => {
    setFilter((prev) => ({ 
      ...prev, 
      hasNote: prev.hasNote ? undefined : true 
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilter({ sortBy: filter.sortBy });
  }, [filter.sortBy]);

  const toggleDisplayType = useCallback(() => {
    setDisplayType(prev => prev === "list" ? "grid" : "list");
  }, []);

  const handlePhotoClick = useCallback((photoId: string) => {
    navigate(`/photo/${photoId}`);
  }, [navigate]);

  const handleDeleteClick = useCallback((photoId: string) => {
    setDeleteTarget(photoId);
  }, []);

  const navigateToCamera = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const headerTitle = viewMode === "folders" 
    ? t.gallery.title 
    : selectedFolder === null 
      ? t.gallery.uncategorized 
      : (selectedFolder ?? t.gallery.uncategorized);

  const headerSubtitle = viewMode === "folders"
    ? `${folders.length} ${folders.length === 1 ? t.gallery.folder : t.gallery.folders}, ${allPhotos.length} ${allPhotos.length === 1 ? t.gallery.photo : t.gallery.photos}`
    : `${filteredPhotos.length} ${filteredPhotos.length === 1 ? t.gallery.photo : t.gallery.photos}`;

  const hasActiveFilters = Boolean(filter.hasLocation || filter.hasNote);

  return (
    <div className="min-h-screen bg-background">
      <GalleryHeader
        viewMode={viewMode}
        displayType={displayType}
        headerTitle={headerTitle}
        headerSubtitle={headerSubtitle}
        filter={filter}
        isUploading={isUploading}
        hasPhotos={allPhotos.length > 0}
        uploadedCount={uploadedCount}
        isImgbbValidated={settings.imgbb?.isValidated ?? false}
        onBack={handleBackToFolders}
        onBackToCamera={navigateToCamera}
        onToggleDisplayType={toggleDisplayType}
        onToggleSortOrder={toggleSortOrder}
        onToggleLocationFilter={toggleLocationFilter}
        onToggleNoteFilter={toggleNoteFilter}
        onClearFilters={clearFilters}
        onUploadCurrentView={handleUploadCurrentView}
        onGetLinks={handleGetLinks}
        onClearAll={() => setShowClearDialog(true)}
        t={t}
      />

      {viewMode === "photos" && (
        <GalleryFilters filter={filter} t={t} />
      )}

      <main className="p-4 safe-bottom">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="aspect-square bg-card animate-pulse rounded-md"
              />
            ))}
          </div>
        ) : allPhotos.length === 0 ? (
          <GalleryEmptyState
            type="no-photos"
            hasFilters={false}
            onNavigateToCamera={navigateToCamera}
            onBackToFolders={handleBackToFolders}
            t={t}
          />
        ) : viewMode === "folders" ? (
          <GalleryFolderList
            folders={folders}
            displayType={displayType}
            onFolderSelect={handleFolderSelect}
            t={t}
          />
        ) : filteredPhotos.length === 0 ? (
          <GalleryEmptyState
            type="empty-folder"
            hasFilters={hasActiveFilters}
            onNavigateToCamera={navigateToCamera}
            onBackToFolders={handleBackToFolders}
            t={t}
          />
        ) : (
          <AutoSizerContainer className="flex-1" style={{ height: "calc(100vh - 180px)" }}>
            {({ width, height }) =>
              displayType === "list" ? (
                <VirtualizedPhotoList
                  photos={filteredPhotos}
                  onPhotoClick={handlePhotoClick}
                  onDeleteClick={handleDeleteClick}
                  containerHeight={height}
                />
              ) : (
                <VirtualizedPhotoGrid
                  photos={filteredPhotos}
                  onPhotoClick={handlePhotoClick}
                  onDeleteClick={handleDeleteClick}
                  containerHeight={height}
                  containerWidth={width}
                />
              )
            }
          </AutoSizerContainer>
        )}
      </main>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title={t.gallery.deletePhoto}
        description={t.photoDetail.noNote}
        confirmText={t.common.delete}
        onConfirm={handleDelete}
        variant="destructive"
        confirmTestId="button-confirm-delete"
        cancelTestId="button-cancel-delete"
      />

      <ConfirmDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title={t.gallery.clearAll}
        description={t.gallery.clearAllConfirmDescription.replace("{count}", String(allPhotos.length))}
        confirmText={t.gallery.clearAll}
        onConfirm={handleClearAll}
        variant="destructive"
        confirmTestId="button-confirm-clear"
        cancelTestId="button-cancel-clear"
      />

      <UploadProgressOverlay 
        isVisible={isUploading}
        completed={uploadProgress.completed}
        total={uploadProgress.total}
      />

      <GalleryLinksDialog
        open={showLinksDialog}
        links={linksToShow}
        onOpenChange={setShowLinksDialog}
        onCopyAllLinks={handleCopyAllLinks}
        t={t}
        toast={toast}
      />
    </div>
  );
}
