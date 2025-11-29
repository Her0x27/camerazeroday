import { memo } from "react";
import { MapPin, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GalleryFilter } from "@shared/schema";

interface GalleryFiltersProps {
  filter: GalleryFilter;
  t: {
    gallery: {
      hasLocation: string;
      hasNote: string;
    };
  };
}

export const GalleryFilters = memo(function GalleryFilters({
  filter,
  t,
}: GalleryFiltersProps) {
  const hasActiveFilters = filter.hasLocation || filter.hasNote;
  
  if (!hasActiveFilters) {
    return null;
  }

  return (
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
  );
});
