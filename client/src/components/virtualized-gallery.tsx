import { memo, useRef, useEffect, useState, useMemo } from "react";
import { List, Grid, RowComponentProps, CellComponentProps } from "react-window";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/date-utils";
import { LocationBadge, NoteBadge } from "@/components/photo-badges";
import type { Photo } from "@shared/schema";

interface VirtualizedListProps {
  photos: Photo[];
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  containerHeight: number;
}

interface VirtualizedGridProps {
  photos: Photo[];
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  containerHeight: number;
  containerWidth: number;
}

interface PhotoListItemData {
  photos: Photo[];
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

interface PhotoGridItemData {
  photos: Photo[];
  columnCount: number;
  onPhotoClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

const LIST_ITEM_HEIGHT = 80;
const GRID_GAP = 8;
const MIN_CELL_SIZE = 120;
const SCROLLBAR_WIDTH = 17;

type PhotoListItemProps = RowComponentProps<PhotoListItemData>;

const PhotoListItem = memo(function PhotoListItem({
  index,
  style,
  photos,
  onPhotoClick,
  onDeleteClick,
}: PhotoListItemProps) {
  const photo = photos[index];

  if (!photo) return null;

  return (
    <div style={{ ...style, paddingBottom: 8 }}>
      <Card
        className="group flex items-center gap-3 p-2 cursor-pointer hover-elevate h-full"
        onClick={() => onPhotoClick(photo.id)}
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
            onDeleteClick(photo.id);
          }}
          data-testid={`button-delete-${photo.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </Card>
    </div>
  );
});

type PhotoGridCellProps = CellComponentProps<PhotoGridItemData>;

const PhotoGridCell = memo(function PhotoGridCell({
  columnIndex,
  rowIndex,
  style,
  photos,
  columnCount,
  onPhotoClick,
  onDeleteClick,
}: PhotoGridCellProps) {
  const photoIndex = rowIndex * columnCount + columnIndex;
  const photo = photos[photoIndex];

  if (!photo) return null;

  return (
    <div style={{ ...style, padding: GRID_GAP / 2 }}>
      <Card
        className="group relative w-full h-full overflow-hidden cursor-pointer hover-elevate"
        onClick={() => onPhotoClick(photo.id)}
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
            onDeleteClick(photo.id);
          }}
          data-testid={`button-delete-${photo.id}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </Card>
    </div>
  );
});

export function VirtualizedPhotoList({
  photos,
  onPhotoClick,
  onDeleteClick,
  containerHeight,
}: VirtualizedListProps) {
  const rowProps: PhotoListItemData = useMemo(
    () => ({
      photos,
      onPhotoClick,
      onDeleteClick,
    }),
    [photos, onPhotoClick, onDeleteClick]
  );

  if (photos.length === 0 || containerHeight < 50) return null;

  return (
    <List
      style={{ width: "100%" }}
      defaultHeight={containerHeight}
      rowCount={photos.length}
      rowHeight={LIST_ITEM_HEIGHT}
      rowProps={rowProps}
      rowComponent={PhotoListItem}
      overscanCount={5}
    />
  );
}

export function VirtualizedPhotoGrid({
  photos,
  onPhotoClick,
  onDeleteClick,
  containerHeight,
  containerWidth,
}: VirtualizedGridProps) {
  const availableWidth = containerWidth - SCROLLBAR_WIDTH;
  
  const { columnCount, cellSize, rowCount } = useMemo(() => {
    const cols = Math.max(2, Math.floor(availableWidth / MIN_CELL_SIZE));
    const size = Math.floor((availableWidth - GRID_GAP) / cols);
    const rows = Math.ceil(photos.length / cols);
    return { columnCount: cols, cellSize: size, rowCount: Math.max(1, rows) };
  }, [availableWidth, photos.length]);

  const cellProps: PhotoGridItemData = useMemo(
    () => ({
      photos,
      columnCount,
      onPhotoClick,
      onDeleteClick,
    }),
    [photos, columnCount, onPhotoClick, onDeleteClick]
  );

  if (photos.length === 0 || containerHeight < 50 || containerWidth < 100) return null;

  return (
    <Grid
      defaultHeight={containerHeight}
      defaultWidth={availableWidth}
      columnCount={columnCount}
      columnWidth={cellSize}
      rowCount={rowCount}
      rowHeight={cellSize}
      cellProps={cellProps}
      cellComponent={PhotoGridCell}
      overscanCount={3}
    />
  );
}

interface AutoSizerContainerProps {
  children: (size: { width: number; height: number }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function AutoSizerContainer({ children, className, style }: AutoSizerContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width, height });
        }
      }
    };

    observerRef.current = new ResizeObserver(handleResize);
    observerRef.current.observe(container);

    const { clientWidth, clientHeight } = container;
    if (clientWidth > 0 && clientHeight > 0) {
      setSize({ width: clientWidth, height: clientHeight });
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={className} style={{ ...style, minHeight: 100 }}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
