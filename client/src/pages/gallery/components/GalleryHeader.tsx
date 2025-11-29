import { memo } from "react";
import { ArrowLeft, ChevronLeft, List, Grid, SortAsc, SortDesc, Filter, MapPin, FileText, X, Cloud, Upload, Link, Trash2, Loader2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { GalleryFilter } from "@shared/schema";

type ViewMode = "folders" | "photos";
type DisplayType = "list" | "grid";

interface GalleryHeaderProps {
  viewMode: ViewMode;
  displayType: DisplayType;
  headerTitle: string;
  headerSubtitle: string;
  filter: GalleryFilter;
  isUploading: boolean;
  hasPhotos: boolean;
  uploadedCount: number;
  isImgbbValidated: boolean;
  onBack: () => void;
  onBackToCamera: () => void;
  onToggleDisplayType: () => void;
  onToggleSortOrder: () => void;
  onToggleLocationFilter: () => void;
  onToggleNoteFilter: () => void;
  onClearFilters: () => void;
  onUploadCurrentView: () => void;
  onGetLinks: () => void;
  onClearAll: () => void;
  t: {
    gallery: {
      filterPhotos: string;
      hasLocation: string;
      hasNote: string;
      clearFilters: string;
      uploadFolder: string;
      uploadAll: string;
      getLinks: string;
    };
    settings: {
      cloud: {
        title: string;
      };
    };
  };
}

export const GalleryHeader = memo(function GalleryHeader({
  viewMode,
  displayType,
  headerTitle,
  headerSubtitle,
  filter,
  isUploading,
  hasPhotos,
  uploadedCount,
  isImgbbValidated,
  onBack,
  onBackToCamera,
  onToggleDisplayType,
  onToggleSortOrder,
  onToggleLocationFilter,
  onToggleNoteFilter,
  onClearFilters,
  onUploadCurrentView,
  onGetLinks,
  onClearAll,
  t,
}: GalleryHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={viewMode === "photos" ? onBack : onBackToCamera}
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
            onClick={onToggleDisplayType}
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
                onClick={onToggleSortOrder}
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
                    onClick={onToggleLocationFilter}
                    data-testid="filter-has-location"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {t.gallery.hasLocation}
                    {filter.hasLocation && <span className="ml-auto text-primary">Active</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onToggleNoteFilter}
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
                        onClick={onClearFilters}
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

          {hasPhotos && (
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
                  onClick={onUploadCurrentView}
                  disabled={isUploading || !isImgbbValidated}
                  data-testid="button-upload-to-cloud"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {viewMode === "photos" ? t.gallery.uploadFolder : t.gallery.uploadAll}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onGetLinks}
                  disabled={uploadedCount === 0}
                  data-testid="button-get-links"
                >
                  <Link className="w-4 h-4 mr-2" />
                  {t.gallery.getLinks} ({uploadedCount})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {hasPhotos && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearAll}
              className="text-destructive hover:text-destructive"
              data-testid="button-clear-all"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
});
