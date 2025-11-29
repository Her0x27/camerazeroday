import { memo } from "react";
import type { ReticleConfig } from "@shared/schema";

interface ReticleProps {
  config: ReticleConfig;
  dynamicColor?: string;
  className?: string;
}

export const Reticle = memo(function Reticle({ config, dynamicColor, className = "" }: ReticleProps) {
  if (!config.enabled) return null;

  const sizePercent = config.size || 20;
  const strokeWidthPercent = config.strokeWidth || 3;

  const defaultColor = "#22c55e";
  const color = (config.autoColor && dynamicColor) ? dynamicColor : defaultColor;

  const style = {
    opacity: config.opacity / 100,
    color: color,
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

export function getContrastingColor(r: number, g: number, b: number): string {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  if (luminance > 0.6) {
    return "#000000";
  } else if (luminance < 0.4) {
    return "#ffffff";
  } else {
    const hue = rgbToHue(r, g, b);
    const complementaryHue = (hue + 180) % 360;
    return hslToHex(complementaryHue, 100, 50);
  }
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  
  let hue = 0;
  
  if (delta !== 0) {
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  
  return hue;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h < 60) {
    r = c; g = x; b = 0;
  } else if (h < 120) {
    r = x; g = c; b = 0;
  } else if (h < 180) {
    r = 0; g = c; b = x;
  } else if (h < 240) {
    r = 0; g = x; b = c;
  } else if (h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
