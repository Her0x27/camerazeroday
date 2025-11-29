import { memo } from "react";
import type { ReticleConfig } from "@shared/schema";

interface ReticleProps {
  config: ReticleConfig;
  className?: string;
}

export const Reticle = memo(function Reticle({ config, className = "" }: ReticleProps) {
  if (!config.enabled) return null;

  const sizePercent = config.size || 20;
  const strokeWidthPercent = config.strokeWidth || 3;

  const style = {
    opacity: config.opacity / 100,
    color: "#22c55e",
    width: `${sizePercent}vmin`,
    height: `${sizePercent}vmin`,
  };

  const svgStrokeWidth = strokeWidthPercent;

  return (
    <div 
      className={`absolute inset-0 pointer-events-none flex items-center justify-center ${className}`}
      style={{ zIndex: 1 }}
    >
      <svg
        viewBox="0 0 100 100"
        style={style}
        className="drop-shadow-lg"
      >
        <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth={svgStrokeWidth} />
        <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth={svgStrokeWidth} />
      </svg>
    </div>
  );
});
