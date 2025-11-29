import { useState, useRef, useCallback, useEffect } from "react";

interface Point {
  row: number;
  col: number;
}

interface PatternLockProps {
  onPatternComplete: (pattern: number[]) => void;
  size?: number;
  dotSize?: number;
  lineColor?: string;
  dotColor?: string;
  activeDotColor?: string;
  disabled?: boolean;
  showPath?: boolean;
}

const GRID_SIZE = 3;

export function PatternLock({
  onPatternComplete,
  size = 240,
  dotSize = 20,
  lineColor = "hsl(var(--primary))",
  dotColor = "hsl(var(--muted-foreground) / 0.5)",
  activeDotColor = "hsl(var(--primary))",
  disabled = false,
  showPath = true,
}: PatternLockProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const cellSize = size / GRID_SIZE;
  
  const getPointIndex = (row: number, col: number): number => {
    return row * GRID_SIZE + col;
  };
  
  const getPointCoords = (index: number): { x: number; y: number } => {
    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2,
    };
  };
  
  const getPointFromCoords = (x: number, y: number): number | null => {
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return null;
    }
    
    const centerX = col * cellSize + cellSize / 2;
    const centerY = row * cellSize + cellSize / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance <= cellSize * 0.4) {
      return getPointIndex(row, col);
    }
    
    return null;
  };
  
  const getEventCoords = (e: React.TouchEvent | React.MouseEvent): { x: number; y: number } | null => {
    if (!containerRef.current) return null;
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };
  
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    
    const coords = getEventCoords(e);
    if (!coords) return;
    
    const pointIndex = getPointFromCoords(coords.x, coords.y);
    if (pointIndex !== null) {
      setPattern([pointIndex]);
      setIsDrawing(true);
      setCurrentPos(coords);
    }
  }, [disabled, cellSize]);
  
  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    
    const coords = getEventCoords(e);
    if (!coords) return;
    
    setCurrentPos(coords);
    
    const pointIndex = getPointFromCoords(coords.x, coords.y);
    if (pointIndex !== null && !pattern.includes(pointIndex)) {
      setPattern(prev => [...prev, pointIndex]);
    }
  }, [isDrawing, disabled, pattern, cellSize]);
  
  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setCurrentPos(null);
    
    if (pattern.length >= 4) {
      onPatternComplete(pattern);
    }
    
    setTimeout(() => {
      setPattern([]);
    }, 300);
  }, [isDrawing, pattern, onPatternComplete]);
  
  useEffect(() => {
    const handleTouchEnd = () => handleEnd();
    const handleMouseUp = () => handleEnd();
    
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleEnd]);
  
  const renderLines = () => {
    if (!showPath || pattern.length < 2) return null;
    
    const lines: JSX.Element[] = [];
    
    for (let i = 0; i < pattern.length - 1; i++) {
      const start = getPointCoords(pattern[i]);
      const end = getPointCoords(pattern[i + 1]);
      
      lines.push(
        <line
          key={`line-${i}`}
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke={lineColor}
          strokeWidth={4}
          strokeLinecap="round"
        />
      );
    }
    
    if (isDrawing && currentPos && pattern.length > 0) {
      const lastPoint = getPointCoords(pattern[pattern.length - 1]);
      lines.push(
        <line
          key="line-current"
          x1={lastPoint.x}
          y1={lastPoint.y}
          x2={currentPos.x}
          y2={currentPos.y}
          stroke={lineColor}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.5}
        />
      );
    }
    
    return lines;
  };
  
  const renderDots = () => {
    const dots: JSX.Element[] = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const index = getPointIndex(row, col);
        const isActive = pattern.includes(index);
        const coords = getPointCoords(index);
        
        dots.push(
          <g key={`dot-${index}`}>
            <circle
              cx={coords.x}
              cy={coords.y}
              r={isActive ? dotSize / 2 + 4 : dotSize / 2}
              fill={isActive ? activeDotColor : dotColor}
              className="transition-all duration-150"
            />
            {isActive && (
              <circle
                cx={coords.x}
                cy={coords.y}
                r={dotSize / 2 + 12}
                fill="none"
                stroke={activeDotColor}
                strokeWidth={2}
                opacity={0.3}
                className="animate-ping"
              />
            )}
          </g>
        );
      }
    }
    
    return dots;
  };
  
  return (
    <div
      ref={containerRef}
      className="relative touch-none select-none"
      style={{ width: size, height: size }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      data-testid="pattern-lock-grid"
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
      >
        {renderLines()}
        {renderDots()}
      </svg>
    </div>
  );
}

export function patternToString(pattern: number[]): string {
  return pattern.join("-");
}

export function stringToPattern(str: string): number[] {
  if (!str) return [];
  return str.split("-").map(Number).filter(n => !isNaN(n));
}
