import { memo } from "react";
import { MapPin, FileText, Cloud, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LocationBadgeProps {
  variant?: "default" | "overlay";
  className?: string;
}

export const LocationBadge = memo(function LocationBadge({ 
  variant = "default",
  className 
}: LocationBadgeProps) {
  const baseClasses = variant === "overlay" 
    ? "bg-black/60 text-white border-none" 
    : "";
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("text-[10px] px-1.5 py-0.5", baseClasses, className)}
      data-testid="badge-location"
    >
      <MapPin className="w-2.5 h-2.5 mr-0.5" />
      GPS
    </Badge>
  );
});

interface NoteBadgeProps {
  variant?: "default" | "overlay";
  className?: string;
}

export const NoteBadge = memo(function NoteBadge({ 
  variant = "default",
  className 
}: NoteBadgeProps) {
  const { t } = useI18n();
  const baseClasses = variant === "overlay" 
    ? "bg-black/60 text-white border-none" 
    : "";
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("text-[10px] px-1.5 py-0.5", baseClasses, className)}
      data-testid="badge-note"
    >
      <FileText className="w-2.5 h-2.5 mr-0.5" />
      {t.components.badges.note}
    </Badge>
  );
});

interface CloudBadgeProps {
  uploaded: boolean;
  variant?: "default" | "overlay";
  className?: string;
}

export const CloudBadge = memo(function CloudBadge({ 
  uploaded,
  variant = "default",
  className 
}: CloudBadgeProps) {
  const { t } = useI18n();
  const baseClasses = variant === "overlay" 
    ? "bg-black/60 text-white border-none" 
    : "";
  
  const Icon = uploaded ? Cloud : CloudOff;
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("text-[10px] px-1.5 py-0.5", baseClasses, className)}
      data-testid="badge-cloud"
    >
      <Icon className="w-2.5 h-2.5 mr-0.5" />
      {uploaded ? t.components.badges.cloud : t.components.badges.local}
    </Badge>
  );
});

interface PhotoCountBadgeProps {
  count: number;
  variant?: "default" | "overlay";
  className?: string;
}

export const PhotoCountBadge = memo(function PhotoCountBadge({ 
  count,
  variant = "default",
  className 
}: PhotoCountBadgeProps) {
  const { t } = useI18n();
  const baseClasses = variant === "overlay" 
    ? "bg-black/60 text-white border-none" 
    : "";
  
  const label = count === 1 ? t.components.badges.photo : t.components.badges.photos;
  
  return (
    <Badge 
      variant="secondary" 
      className={cn("text-xs", baseClasses, className)}
      data-testid="badge-photo-count"
    >
      {count} {label}
    </Badge>
  );
});
