import type { ReticleConfig } from "@shared/schema";

interface ReticleProps {
  config: ReticleConfig;
  className?: string;
}

// Simple crosshair reticle component
export function Reticle({ config, className = "" }: ReticleProps) {
  if (!config.enabled) return null;

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
        {/* Center dot */}
        <circle cx="50" cy="50" r="2" fill="currentColor" />
        
        {/* Horizontal line */}
        <line x1="15" y1="50" x2="42" y2="50" stroke="currentColor" strokeWidth="1.5" />
        <line x1="58" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Vertical line */}
        <line x1="50" y1="15" x2="50" y2="42" stroke="currentColor" strokeWidth="1.5" />
        <line x1="50" y1="58" x2="50" y2="85" stroke="currentColor" strokeWidth="1.5" />
        
        {/* Corner marks */}
        <line x1="25" y1="47" x2="25" y2="53" stroke="currentColor" strokeWidth="1" />
        <line x1="75" y1="47" x2="75" y2="53" stroke="currentColor" strokeWidth="1" />
        <line x1="47" y1="25" x2="53" y2="25" stroke="currentColor" strokeWidth="1" />
        <line x1="47" y1="75" x2="53" y2="75" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
