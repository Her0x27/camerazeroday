import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Camera, ArrowLeft, Trash2, Filter, SortAsc, SortDesc, MapPin, FileText, X, Folder, FolderOpen, ChevronLeft, List, Grid, Cloud, Link, Upload, Loader2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getAllPhotos, updatePhoto, getPhoto } from "@/lib/db";
import { uploadMultipleToImgBB } from "@/lib/imgbb";
import { useSettings } from "@/lib/settings-context";
import { useToast } from "@/hooks/use-toast";
import { usePhotoMutations } from "@/hooks/use-photo-mutations";
import { useUploadProgress } from "@/hooks/use-upload-progress";
import { useI18n } from "@/lib/i18n";
import { formatDate } from "@/lib/date-utils";
import { UploadProgressOverlay } from "@/components/upload-progress-overlay";
import { LocationBadge, NoteBadge, CloudBadge } from "@/components/photo-badges";
import type { Photo, GalleryFilter, CloudData } from "@shared/schema";

type ViewMode = "folders" | "photos";
type DisplayType = "list" | "grid";

interface FolderInfo {
  name: string | null;
  count: number;
  latestThumb: string | null;
}

export default function GalleryPage() {
  const [, navigate] = useLocation();
  const { settings } = useSettings();
  const { toast } = useToast();
  const { t, language } = useI18n();
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
  const [linksToShow, setLinksToShow] = useState<Array<{ id: string; url: string; deleteUrl: string }>>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calculate folders from photos
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

  // Get photos for current view
  const displayPhotos = useMemo(() => {
    if (selectedFolder === undefined) {
      return allPhotos;
    }
    return allPhotos.filter(p => (p.folder || null) === selectedFolder);
  }, [allPhotos, selectedFolder]);

  // Apply additional filters
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

  // Load photos
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

  // Handle folder selection
  const handleFolderSelect = useCallback((folderName: string | null) => {
    setSelectedFolder(folderName);
    setViewMode("photos");
  }, []);

  // Go back to folder view
  const handleBackToFolders = useCallback(() => {
    setSelectedFolder(undefined);
    setViewMode("folders");
  }, []);

  // Delete single photo
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

  // Clear all photos
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

  // Upload photos to ImgBB
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

    startUpload(photosToUpload.length);

    try {
      const results = await uploadMultipleToImgBB(
        photosToUpload.map(p => ({ id: p.id, imageData: p.imageData })),
        settings.imgbb.apiKey,
        settings.imgbb.expiration || 0,
        updateProgress
      );

      let successCount = 0;
      let errorCount = 0;

      for (const [photoId, result] of Array.from(results.entries())) {
        if (result.success && result.cloudData) {
          await updatePhoto(photoId, { cloud: result.cloudData });
          setAllPhotos(prev => 
            prev.map(p => p.id === photoId ? { ...p, cloud: result.cloudData } : p)
          );
          successCount++;
        } else {
          errorCount++;
        }
      }

      toast({
        title: t.gallery.uploadComplete,
        description: t.gallery.uploadedCount.replace("{success}", String(successCount)).replace("{errors}", String(errorCount)),
      });
    } catch (error) {
      toast({
        title: t.common.error,
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      finishUpload();
    }
  }, [settings.imgbb, toast, t, startUpload, updateProgress, finishUpload]);

  // Upload current folder or all photos
  const handleUploadCurrentView = useCallback(async () => {
    const photosToUpload = viewMode === "photos" ? filteredPhotos : allPhotos;
    await handleUploadPhotos(photosToUpload);
  }, [viewMode, filteredPhotos, allPhotos, handleUploadPhotos]);

  // Get links for uploaded photos
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

  // Copy link to clipboard
  const handleCopyLink = useCallback(async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: t.common.error,
        description: t.gallery.copyFailed,
        variant: "destructive",
      });
    }
  }, [toast, t]);

  // Copy all links
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

  // Count photos with cloud links
  const uploadedCount = useMemo(() => {
    const photos = viewMode === "photos" ? filteredPhotos : allPhotos;
    return photos.filter(p => p.cloud?.url).length;
  }, [viewMode, filteredPhotos, allPhotos]);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setFilter((prev) => ({
      ...prev,
      sortBy: prev.sortBy === "newest" ? "oldest" : "newest",
    }));
  }, []);

  const headerTitle = viewMode === "folders" 
    ? t.gallery.title 
    : selectedFolder === null 
      ? t.gallery.uncategorized 
      : selectedFolder;

  const headerSubtitle = viewMode === "folders"
    ? `${folders.length} ${folders.length === 1 ? t.gallery.folder : t.gallery.folders}, ${allPhotos.length} ${allPhotos.length === 1 ? t.gallery.photo : t.gallery.photos}`
    : `${filteredPhotos.length} ${filteredPhotos.length === 1 ? t.gallery.photo : t.gallery.photos}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={viewMode === "photos" ? handleBackToFolders : () => navigate("/")}
              data-testid="button-back"
            >
              {viewMode === "photos" ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
            </Button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                {viewMode === "photos" && (
                  <FolderOpen className="w-4 h-4 text-primary" />
                )}
                {headerTitle}
              </h1>
              <p className="text-xs text-muted-foreground">
                {headerSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDisplayType(displayType === "list" ? "grid" : "list")}
              data-testid="button-display-toggle"
            >
              {displayType === "list" ? (
                <Grid className="w-5 h-5" />
              ) : (
                <List className="w-5 h-5" />
              )}
            </Button>

            {viewMode === "photos" && (
              <>
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-filter">
                      <Filter className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t.gallery.filterPhotos}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setFilter((prev) => ({ 
                        ...prev, 
                        hasLocation: prev.hasLocation ? undefined : true 
                      }))}
                      data-testid="filter-has-location"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {t.gallery.hasLocation}
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
                      {t.gallery.hasNote}
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
                          {t.gallery.clearFilters}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {allPhotos.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={isUploading}
                    data-testid="button-cloud-menu"
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Cloud className="w-5 h-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t.settings.cloud.title}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleUploadCurrentView}
                    disabled={isUploading || !settings.imgbb?.isValidated}
                    data-testid="button-upload-to-cloud"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {viewMode === "photos" ? t.gallery.uploadFolder : t.gallery.uploadAll}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleGetLinks}
                    disabled={uploadedCount === 0}
                    data-testid="button-get-links"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    {t.gallery.getLinks} ({uploadedCount})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {allPhotos.length > 0 && (
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

      {viewMode === "photos" && (filter.hasLocation || filter.hasNote) && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {filter.hasLocation && (
            <Badge variant="secondary" className="text-xs gap-1">
              <MapPin className="w-3 h-3" />
              {t.gallery.hasLocation}
            </Badge>
          )}
          {filter.hasNote && (
            <Badge variant="secondary" className="text-xs gap-1">
              <FileText className="w-3 h-3" />
              {t.gallery.hasNote}
            </Badge>
          )}
        </div>
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-4">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{t.gallery.noPhotosYet}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {t.gallery.noPhotosDescription}
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-start-capturing">
              <Camera className="w-4 h-4 mr-2" />
              {t.camera.startCapturing}
            </Button>
          </div>
        ) : viewMode === "folders" ? (
          displayType === "list" ? (
            <div className="flex flex-col gap-2">
              {folders.map((folder) => (
                <Card
                  key={folder.name ?? "__uncategorized__"}
                  className="group flex items-center gap-3 p-2 cursor-pointer hover-elevate"
                  onClick={() => handleFolderSelect(folder.name)}
                  data-testid={`folder-card-${folder.name ?? "uncategorized"}`}
                >
                  <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-card">
                    {folder.latestThumb ? (
                      <img
                        src={folder.latestThumb}
                        alt={folder.name ?? t.gallery.uncategorized}
                        className="w-full h-full object-cover opacity-70"
                        loading="lazy"
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Folder className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {folder.name ?? t.gallery.uncategorized}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className="text-[10px] px-1.5 py-0.5"
                      >
                        {folder.count} {folder.count === 1 ? t.gallery.photo : t.gallery.photos}
                      </Badge>
                    </div>
                  </div>

                  <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {folders.map((folder) => (
                <Card
                  key={folder.name ?? "__uncategorized__"}
                  className="group relative aspect-square overflow-hidden cursor-pointer hover-elevate"
                  onClick={() => handleFolderSelect(folder.name)}
                  data-testid={`folder-card-${folder.name ?? "uncategorized"}`}
                >
                  {folder.latestThumb ? (
                    <img
                      src={folder.latestThumb}
                      alt={folder.name ?? t.gallery.uncategorized}
                      className="w-full h-full object-cover opacity-60"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-card" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-3">
                    <Folder className="w-10 h-10 text-primary mb-2" />
                    <span className="font-semibold text-white text-center text-sm line-clamp-2">
                      {folder.name ?? t.gallery.uncategorized}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className="mt-2 bg-black/60 text-white border-none text-xs"
                    >
                      {folder.count} {folder.count === 1 ? t.gallery.photo : t.gallery.photos}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">{t.gallery.noPhotos}</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {filter.hasLocation || filter.hasNote
                ? t.gallery.noPhotosMatchFilter
                : t.gallery.noPhotosInFolder
              }
            </p>
            <Button onClick={handleBackToFolders} variant="outline" data-testid="button-back-to-folders">
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t.gallery.backToFolders}
            </Button>
          </div>
        ) : displayType === "list" ? (
          <div className="flex flex-col gap-2">
            {filteredPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="group flex items-center gap-3 p-2 cursor-pointer hover-elevate"
                onClick={() => navigate(`/photo/${photo.id}`)}
                data-testid={`photo-card-${photo.id}`}
              >
                <img
                  src={photo.thumbnailData}
                  alt="Photo"
                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  loading="lazy"
                />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {formatDate(photo.metadata.timestamp, "long")}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {photo.metadata.latitude !== null && <LocationBadge />}
                    {photo.note && <NoteBadge />}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(photo.id);
                  }}
                  data-testid={`button-delete-${photo.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {filteredPhotos.map((photo) => (
              <Card
                key={photo.id}
                className="group relative aspect-square overflow-hidden cursor-pointer hover-elevate"
                onClick={() => navigate(`/photo/${photo.id}`)}
                data-testid={`photo-card-${photo.id}`}
              >
                <img
                  src={photo.thumbnailData}
                  alt="Photo"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {photo.metadata.latitude !== null && <LocationBadge variant="overlay" />}
                  {photo.note && <NoteBadge variant="overlay" />}
                </div>

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
        description={`This will permanently delete all ${allPhotos.length} photos from your device. This action cannot be undone.`}
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

      <Dialog open={showLinksDialog} onOpenChange={setShowLinksDialog}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              {t.gallery.cloudLinks} ({linksToShow.length})
            </DialogTitle>
            <DialogDescription>
              {t.gallery.getLinks}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto space-y-3 my-4">
            {linksToShow.map((item, index) => (
              <div 
                key={item.id}
                className="p-2 rounded-md bg-muted/50 space-y-1"
                data-testid={`link-item-${index}`}
              >
                <div 
                  className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded p-1 group"
                  onClick={() => handleCopyLink(item.url, item.id)}
                >
                  <span className="text-xs text-muted-foreground w-12">Link:</span>
                  <span className="flex-1 text-sm truncate font-mono">
                    {item.url}
                  </span>
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                  )}
                </div>
                <div 
                  className="flex items-center gap-2 hover:bg-muted cursor-pointer rounded p-1 group"
                  onClick={() => handleCopyLink(item.deleteUrl, `del-${item.id}`)}
                >
                  <span className="text-xs text-destructive w-12">Delete:</span>
                  <span className="flex-1 text-xs truncate font-mono text-muted-foreground">
                    {item.deleteUrl}
                  </span>
                  {copiedId === `del-${item.id}` ? (
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => setShowLinksDialog(false)}
              data-testid="button-close-links"
            >
              Close
            </Button>
            <Button
              onClick={handleCopyAllLinks}
              data-testid="button-copy-all-links"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
