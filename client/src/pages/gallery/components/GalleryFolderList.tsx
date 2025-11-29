import { memo } from "react";
import { Folder, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DisplayType = "list" | "grid";

export interface FolderInfo {
  name: string | null;
  count: number;
  latestThumb: string | null;
}

interface GalleryFolderListProps {
  folders: FolderInfo[];
  displayType: DisplayType;
  onFolderSelect: (folderName: string | null) => void;
  t: {
    gallery: {
      uncategorized: string;
      photo: string;
      photos: string;
    };
  };
}

const FolderListItem = memo(function FolderListItem({
  folder,
  onSelect,
  t,
}: {
  folder: FolderInfo;
  onSelect: () => void;
  t: GalleryFolderListProps["t"];
}) {
  return (
    <Card
      className="group flex items-center gap-3 p-2 cursor-pointer hover-elevate"
      onClick={onSelect}
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
  );
});

const FolderGridItem = memo(function FolderGridItem({
  folder,
  onSelect,
  t,
}: {
  folder: FolderInfo;
  onSelect: () => void;
  t: GalleryFolderListProps["t"];
}) {
  return (
    <Card
      className="group relative aspect-square overflow-hidden cursor-pointer hover-elevate"
      onClick={onSelect}
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
  );
});

export const GalleryFolderList = memo(function GalleryFolderList({
  folders,
  displayType,
  onFolderSelect,
  t,
}: GalleryFolderListProps) {
  if (displayType === "list") {
    return (
      <div className="flex flex-col gap-2">
        {folders.map((folder) => (
          <FolderListItem
            key={folder.name ?? "__uncategorized__"}
            folder={folder}
            onSelect={() => onFolderSelect(folder.name)}
            t={t}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {folders.map((folder) => (
        <FolderGridItem
          key={folder.name ?? "__uncategorized__"}
          folder={folder}
          onSelect={() => onFolderSelect(folder.name)}
          t={t}
        />
      ))}
    </div>
  );
});
