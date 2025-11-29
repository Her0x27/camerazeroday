import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PatternLock, patternToString } from "@/components/pattern-lock";
import { GESTURE, TIMING, STORAGE_KEYS } from "@/lib/constants";
import { useGame2048, type Grid } from "@/hooks/use-game-2048";

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-muted/50", text: "" },
  2: { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-900 dark:text-amber-100" },
  4: { bg: "bg-amber-200 dark:bg-amber-800/50", text: "text-amber-900 dark:text-amber-100" },
  8: { bg: "bg-orange-300 dark:bg-orange-700/60", text: "text-white" },
  16: { bg: "bg-orange-400 dark:bg-orange-600/70", text: "text-white" },
  32: { bg: "bg-orange-500 dark:bg-orange-500/80", text: "text-white" },
  64: { bg: "bg-red-500 dark:bg-red-500/80", text: "text-white" },
  128: { bg: "bg-yellow-400 dark:bg-yellow-500/80", text: "text-white" },
  256: { bg: "bg-yellow-500 dark:bg-yellow-400/80", text: "text-white" },
  512: { bg: "bg-yellow-600 dark:bg-yellow-600/80", text: "text-white" },
  1024: { bg: "bg-yellow-700 dark:bg-yellow-700/80", text: "text-white" },
  2048: { bg: "bg-emerald-500 dark:bg-emerald-500/80", text: "text-white" },
};

interface GameTileProps {
  value: number;
  rowIdx: number;
  colIdx: number;
}

const GameTile = memo(function GameTile({ value, rowIdx, colIdx }: GameTileProps) {
  const style = TILE_COLORS[value] || TILE_COLORS[2048];
  const className = `flex items-center justify-center rounded-md font-bold transition-all duration-100 ${style.bg} ${style.text}`;
  const fontSize = value >= 1000 ? '1rem' : value >= 100 ? '1.25rem' : '1.5rem';
  
  return (
    <div
      className={className}
      style={{ fontSize }}
      data-testid={`tile-${rowIdx}-${colIdx}`}
    >
      {value > 0 ? value : ''}
    </div>
  );
});

interface Game2048Props {
  onSecretGesture?: () => void;
  gestureType?: 'quickTaps' | 'patternUnlock';
  secretPattern?: string;
  onActivity?: () => void;
}

export function Game2048({ onSecretGesture, gestureType = 'quickTaps', secretPattern = '', onActivity }: Game2048Props) {
  const { t } = useI18n();
  const {
    grid,
    score,
    bestScore,
    gameOver,
    won,
    handleMove,
    handleNewGame,
    handleKeepPlaying,
  } = useGame2048({ onActivity });

  const [showPatternOverlay, setShowPatternOverlay] = useState(false);
  const [patternError, setPatternError] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tapTimesRef = useRef<number[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const patternTapTimesRef = useRef<number[]>([]);
  
  const handleSecretTap = useCallback(() => {
    if (!onSecretGesture) return;
    
    if (gestureType === 'quickTaps') {
      const now = Date.now();
      tapTimesRef.current = tapTimesRef.current.filter(t => now - t < TIMING.TAP_TIMEOUT_MS);
      tapTimesRef.current.push(now);
      
      if (tapTimesRef.current.length >= GESTURE.QUICK_TAP_COUNT) {
        tapTimesRef.current = [];
        onSecretGesture();
      }
    } else if (gestureType === 'patternUnlock') {
      const now = Date.now();
      patternTapTimesRef.current = patternTapTimesRef.current.filter(t => now - t < TIMING.PATTERN_TAP_TIMEOUT_MS);
      patternTapTimesRef.current.push(now);
      
      if (patternTapTimesRef.current.length >= GESTURE.PATTERN_UNLOCK_TAP_COUNT) {
        patternTapTimesRef.current = [];
        setShowPatternOverlay(true);
        setPatternError(false);
      }
    }
  }, [gestureType, onSecretGesture]);
  
  const handlePatternComplete = useCallback((pattern: number[]) => {
    const enteredPattern = patternToString(pattern);
    
    if (enteredPattern === secretPattern) {
      setShowPatternOverlay(false);
      setPatternError(false);
      onSecretGesture?.();
    } else {
      setPatternError(true);
      setTimeout(() => setPatternError(false), TIMING.TAP_TIMEOUT_MS);
    }
  }, [secretPattern, onSecretGesture]);
  
  const handleClosePatternOverlay = useCallback(() => {
    setShowPatternOverlay(false);
    setPatternError(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const directions: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      };
      
      if (directions[e.key]) {
        e.preventDefault();
        handleMove(directions[e.key]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      if (Math.max(absDx, absDy) < GESTURE.MIN_SWIPE_DISTANCE_PX) {
        handleSecretTap();
        return;
      }
      
      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
      
      touchStartRef.current = null;
    };
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove, handleSecretTap]);
  
  const gridTiles = useMemo(() => {
    return grid.flatMap((row, rowIdx) =>
      row.map((cell, colIdx) => (
        <GameTile key={`${rowIdx}-${colIdx}`} value={cell} rowIdx={rowIdx} colIdx={colIdx} />
      ))
    );
  }, [grid]);
  
  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-screen bg-background p-4 select-none touch-none safe-top safe-bottom"
      onClick={handleSecretTap}
      data-testid="game-2048-container"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-2xl font-bold">{t.game2048.title}</CardTitle>
            <Button 
              variant="outline" 
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleNewGame();
              }}
              data-testid="button-new-game"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
              <span className="text-xs text-muted-foreground">{t.game2048.score}</span>
              <span className="font-bold" data-testid="text-score">{score}</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-muted rounded-md">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span className="text-xs text-muted-foreground">{t.game2048.best}</span>
              <span className="font-bold" data-testid="text-best-score">{bestScore}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div 
            className="relative bg-muted/30 rounded-lg p-2 aspect-square"
            data-testid="game-grid"
          >
            <div className="grid grid-cols-4 gap-2 h-full">
              {gridTiles}
            </div>
            
            {(gameOver || won) && (
              <GameOverlay
                gameOver={gameOver}
                won={won}
                onNewGame={handleNewGame}
                onKeepPlaying={handleKeepPlaying}
              />
            )}
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            {t.game2048.instructions}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            {t.game2048.swipeToMove}
          </p>
          
          <MobileControls onMove={handleMove} />
        </CardContent>
      </Card>
      
      {showPatternOverlay && (
        <PatternOverlay
          onPatternComplete={handlePatternComplete}
          onClose={handleClosePatternOverlay}
          patternError={patternError}
        />
      )}
    </div>
  );
}

interface GameOverlayProps {
  gameOver: boolean;
  won: boolean;
  onNewGame: () => void;
  onKeepPlaying: () => void;
}

const GameOverlay = memo(function GameOverlay({ gameOver, won, onNewGame, onKeepPlaying }: GameOverlayProps) {
  const { t } = useI18n();
  
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
      <p className="text-2xl font-bold mb-4">
        {gameOver ? t.game2048.gameOver : t.game2048.youWin}
      </p>
      <div className="flex gap-2">
        <Button onClick={(e) => { e.stopPropagation(); onNewGame(); }} data-testid="button-try-again">
          {t.game2048.tryAgain}
        </Button>
        {won && (
          <Button variant="outline" onClick={(e) => { e.stopPropagation(); onKeepPlaying(); }} data-testid="button-keep-playing">
            {t.game2048.keepPlaying}
          </Button>
        )}
      </div>
    </div>
  );
});

interface MobileControlsProps {
  onMove: (direction: 'left' | 'right' | 'up' | 'down') => void;
}

const MobileControls = memo(function MobileControls({ onMove }: MobileControlsProps) {
  return (
    <>
      <div className="flex justify-center gap-1 mt-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => onMove('up')} className="touch-none">
          <ArrowUp className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex justify-center gap-1 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => onMove('left')} className="touch-none">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMove('down')} className="touch-none">
          <ArrowDown className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onMove('right')} className="touch-none">
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </>
  );
});

interface PatternOverlayProps {
  onPatternComplete: (pattern: number[]) => void;
  onClose: () => void;
  patternError: boolean;
}

const PatternOverlay = memo(function PatternOverlay({ onPatternComplete, onClose, patternError }: PatternOverlayProps) {
  const { t } = useI18n();
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
      onClick={onClose}
      data-testid="pattern-overlay"
    >
      <div 
        className="flex flex-col items-center gap-6 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lock className="w-5 h-5" />
          <span className="text-sm font-medium">{t.game2048.drawPattern}</span>
        </div>
        
        <div className={`p-4 rounded-xl bg-muted/30 ${patternError ? 'animate-shake ring-2 ring-destructive' : ''}`}>
          <PatternLock
            onPatternComplete={onPatternComplete}
            size={220}
            dotSize={18}
            lineColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
            activeDotColor={patternError ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center max-w-[200px]">
          {t.game2048.patternHint}
        </p>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground"
          data-testid="button-cancel-pattern"
        >
          {t.game2048.cancel}
        </Button>
      </div>
    </div>
  );
});

export default Game2048;
