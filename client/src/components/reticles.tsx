import type { ReticleConfig } from "@shared/schema";

interface ReticleProps {
  config: ReticleConfig;
  className?: string;
}

// Simple crosshair - just two crossing lines
export function Reticle({ config, className = "" }: ReticleProps) {
  if (!config.enabled) return null;

  const halfSize = config.size / 2;
  const style = {
    opacity: config.opacity / 100,
    color: "#22c55e", // tactical green
    width: `${config.size}px`,
    height: `${config.size}px`,
  };

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
        {/* Horizontal line */}
        <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Vertical line */}
        <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}
