import { memo } from "react";
import { Camera, Settings, Image, Gamepad2, FileText, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraControlsProps {
  onCapture: () => void;
  onNavigateGallery: () => void;
  onNavigateSettings: () => void;
  onOpenNote: () => void;
  onMask: () => void;
  isReady: boolean;
  isCapturing: boolean;
  accuracyBlocked: boolean;
  hasNote: boolean;
  lastPhotoThumb: string | null;
  photoCount: number;
  cloudCount: number;
  showMaskButton: boolean;
}

export const CameraControls = memo(function CameraControls({
  onCapture,
  onNavigateGallery,
  onNavigateSettings,
  onOpenNote,
  onMask,
  isReady,
  isCapturing,
  accuracyBlocked,
  hasNote,
  lastPhotoThumb,
  photoCount,
  cloudCount,
  showMaskButton,
}: CameraControlsProps) {
  return (
    <div className="bg-black/80 backdrop-blur-sm safe-bottom z-10">
      <div className="relative flex items-center justify-center px-[5%] py-2 h-20">
        <CaptureButton
          onCapture={onCapture}
          isReady={isReady}
          isCapturing={isCapturing}
          accuracyBlocked={accuracyBlocked}
        />

        <GalleryButton
          onNavigate={onNavigateGallery}
          lastPhotoThumb={lastPhotoThumb}
          photoCount={photoCount}
          cloudCount={cloudCount}
        />

        <RightControls
          onOpenNote={onOpenNote}
          onNavigateSettings={onNavigateSettings}
          onMask={onMask}
          hasNote={hasNote}
          showMaskButton={showMaskButton}
        />
      </div>
    </div>
  );
});

interface CaptureButtonProps {
  onCapture: () => void;
  isReady: boolean;
  isCapturing: boolean;
  accuracyBlocked: boolean;
}

const CaptureButton = memo(function CaptureButton({
  onCapture,
  isReady,
  isCapturing,
  accuracyBlocked,
}: CaptureButtonProps) {
  return (
    <button
      onClick={onCapture}
      disabled={!isReady || isCapturing || accuracyBlocked}
      className={`aspect-square w-16 h-16 rounded-full border-3 flex items-center justify-center transition-all overflow-hidden ${
        accuracyBlocked
          ? "border-red-500/50 bg-red-500/10"
          : isReady && !isCapturing
            ? "border-white bg-white/10 hover:bg-white/20 active:scale-95 active:bg-white/30"
            : "border-muted-foreground/50 bg-muted/20"
      }`}
      data-testid="button-capture"
    >
      {accuracyBlocked ? (
        <div className="w-[70%] h-[70%] rounded-full bg-red-500/30 flex items-center justify-center">
          <span className="text-red-500 text-xs font-bold">GPS</span>
        </div>
      ) : (
        <div 
          className={`w-[70%] h-[70%] rounded-full transition-all ${
            isCapturing 
              ? "bg-primary scale-75" 
              : isReady 
                ? "bg-white" 
                : "bg-muted"
          }`}
        />
      )}
    </button>
  );
});

interface GalleryButtonProps {
  onNavigate: () => void;
  lastPhotoThumb: string | null;
  photoCount: number;
  cloudCount: number;
}

const GalleryButton = memo(function GalleryButton({
  onNavigate,
  lastPhotoThumb,
  photoCount,
  cloudCount,
}: GalleryButtonProps) {
  return (
    <div className="absolute left-4 flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-md bg-card/50 text-white hover:bg-card relative aspect-square w-14 h-14"
        onClick={onNavigate}
        data-testid="button-gallery"
      >
        {lastPhotoThumb ? (
          <img 
            src={lastPhotoThumb} 
            alt="Last photo" 
            className="w-full h-full object-cover opacity-70 rounded-sm"
          />
        ) : (
          <Image className="w-7 h-7" />
        )}
        {photoCount > 0 && (
          <span 
            className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center gap-0.5 px-1"
            data-testid="badge-photo-count"
          >
            <Camera className="w-2.5 h-2.5" />
            {photoCount > 99 ? "99+" : photoCount}
          </span>
        )}
        {cloudCount > 0 && (
          <span 
            className="absolute -bottom-1.5 -right-1.5 min-w-5 h-5 bg-green-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center gap-0.5 px-1"
            data-testid="badge-cloud-count"
          >
            <Cloud className="w-2.5 h-2.5" />
            {cloudCount > 99 ? "99+" : cloudCount}
          </span>
        )}
      </Button>
    </div>
  );
});

interface RightControlsProps {
  onOpenNote: () => void;
  onNavigateSettings: () => void;
  onMask: () => void;
  hasNote: boolean;
  showMaskButton: boolean;
}

const RightControls = memo(function RightControls({
  onOpenNote,
  onNavigateSettings,
  onMask,
  hasNote,
  showMaskButton,
}: RightControlsProps) {
  return (
    <div className="absolute right-4 flex items-center gap-2">
      {showMaskButton && (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md bg-amber-500/30 text-amber-400 hover:bg-amber-500/50 aspect-square w-14 h-14"
          onClick={onMask}
          data-testid="button-mask"
        >
          <Gamepad2 className="w-7 h-7" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="rounded-md bg-card/50 text-white hover:bg-card relative aspect-square w-14 h-14"
        onClick={onOpenNote}
        data-testid="button-note"
      >
        <FileText className="w-7 h-7" />
        {hasNote && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-md bg-card/50 text-white hover:bg-card aspect-square w-14 h-14"
        onClick={onNavigateSettings}
        data-testid="button-settings"
      >
        <Settings className="w-7 h-7" />
      </Button>
    </div>
  );
});
