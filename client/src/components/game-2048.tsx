import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PatternLock, patternToString } from "@/components/pattern-lock";

type Grid = number[][];

interface Position {
  row: number;
  col: number;
}

const GRID_SIZE = 4;
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

function createEmptyGrid(): Grid {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
}

function getRandomEmptyCell(grid: Grid): Position | null {
  const emptyCells: Position[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function addRandomTile(grid: Grid): Grid {
  const newGrid = grid.map(row => [...row]);
  const pos = getRandomEmptyCell(newGrid);
  if (pos) {
    newGrid[pos.row][pos.col] = Math.random() < 0.9 ? 2 : 4;
  }
  return newGrid;
}

function initializeGrid(): Grid {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

function rotateGrid(grid: Grid): Grid {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[col][GRID_SIZE - 1 - row] = grid[row][col];
    }
  }
  return newGrid;
}

function slideRow(row: number[]): { row: number[]; score: number } {
  const nonZero = row.filter(x => x !== 0);
  const newRow: number[] = [];
  let score = 0;
  
  for (let i = 0; i < nonZero.length; i++) {
    if (i < nonZero.length - 1 && nonZero[i] === nonZero[i + 1]) {
      const merged = nonZero[i] * 2;
      newRow.push(merged);
      score += merged;
      i++;
    } else {
      newRow.push(nonZero[i]);
    }
  }
  
  while (newRow.length < GRID_SIZE) {
    newRow.push(0);
  }
  
  return { row: newRow, score };
}

function moveLeft(grid: Grid): { grid: Grid; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newGrid = grid.map(row => {
    const { row: newRow, score } = slideRow(row);
    totalScore += score;
    if (row.join(',') !== newRow.join(',')) moved = true;
    return newRow;
  });
  return { grid: newGrid, score: totalScore, moved };
}

function move(grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): { grid: Grid; score: number; moved: boolean } {
  let rotatedGrid = [...grid.map(row => [...row])];
  const rotations: Record<string, number> = { left: 0, up: 1, right: 2, down: 3 };
  
  for (let i = 0; i < rotations[direction]; i++) {
    rotatedGrid = rotateGrid(rotatedGrid);
  }
  
  const { grid: movedGrid, score, moved } = moveLeft(rotatedGrid);
  
  let finalGrid = movedGrid;
  for (let i = 0; i < (4 - rotations[direction]) % 4; i++) {
    finalGrid = rotateGrid(finalGrid);
  }
  
  return { grid: finalGrid, score, moved };
}

function canMove(grid: Grid): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) return true;
      if (col < GRID_SIZE - 1 && grid[row][col] === grid[row][col + 1]) return true;
      if (row < GRID_SIZE - 1 && grid[row][col] === grid[row + 1][col]) return true;
    }
  }
  return false;
}

function hasWon(grid: Grid): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] >= 2048) return true;
    }
  }
  return false;
}

interface Game2048Props {
  onSecretGesture?: () => void;
  gestureType?: 'quickTaps' | 'patternUnlock';
  secretPattern?: string;
  onActivity?: () => void;
}

export function Game2048({ onSecretGesture, gestureType = 'quickTaps', secretPattern = '', onActivity }: Game2048Props) {
  const { t } = useI18n();
  const [grid, setGrid] = useState<Grid>(initializeGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('game2048-best');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [showPatternOverlay, setShowPatternOverlay] = useState(false);
  const [patternError, setPatternError] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const tapTimesRef = useRef<number[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const patternTapTimesRef = useRef<number[]>([]);
  
  const handleMove = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver || (won && !keepPlaying)) return;
    
    onActivity?.();
    
    const { grid: newGrid, score: moveScore, moved } = move(grid, direction);
    
    if (moved) {
      const gridWithNewTile = addRandomTile(newGrid);
      setGrid(gridWithNewTile);
      setScore(prev => {
        const newScore = prev + moveScore;
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('game2048-best', newScore.toString());
        }
        return newScore;
      });
      
      if (!keepPlaying && hasWon(gridWithNewTile)) {
        setWon(true);
      } else if (!canMove(gridWithNewTile)) {
        setGameOver(true);
      }
    }
  }, [grid, gameOver, won, keepPlaying, bestScore, onActivity]);
  
  const handleSecretTap = useCallback(() => {
    if (!onSecretGesture) return;
    
    if (gestureType === 'quickTaps') {
      const now = Date.now();
      tapTimesRef.current = tapTimesRef.current.filter(t => now - t < 1000);
      tapTimesRef.current.push(now);
      
      if (tapTimesRef.current.length >= 4) {
        tapTimesRef.current = [];
        onSecretGesture();
      }
    } else if (gestureType === 'patternUnlock') {
      const now = Date.now();
      patternTapTimesRef.current = patternTapTimesRef.current.filter(t => now - t < 800);
      patternTapTimesRef.current.push(now);
      
      if (patternTapTimesRef.current.length >= 3) {
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
      setTimeout(() => setPatternError(false), 1000);
    }
  }, [secretPattern, onSecretGesture]);
  
  const handleClosePatternOverlay = useCallback(() => {
    setShowPatternOverlay(false);
    setPatternError(false);
  }, []);
  
  const handleNewGame = useCallback(() => {
    setGrid(initializeGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    onActivity?.();
  }, [onActivity]);
  
  const handleKeepPlaying = useCallback(() => {
    setKeepPlaying(true);
    setWon(false);
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
      
      const minSwipe = 30;
      
      if (Math.max(absDx, absDy) < minSwipe) {
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
  
  const getTileStyle = (value: number) => {
    const style = TILE_COLORS[value] || TILE_COLORS[2048];
    return `${style.bg} ${style.text}`;
  };
  
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
              {grid.map((row, rowIdx) =>
                row.map((cell, colIdx) => (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`flex items-center justify-center rounded-md font-bold transition-all duration-100 ${getTileStyle(cell)}`}
                    style={{ fontSize: cell >= 1000 ? '1rem' : cell >= 100 ? '1.25rem' : '1.5rem' }}
                    data-testid={`tile-${rowIdx}-${colIdx}`}
                  >
                    {cell > 0 ? cell : ''}
                  </div>
                ))
              )}
            </div>
            
            {(gameOver || won) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg backdrop-blur-sm">
                <p className="text-2xl font-bold mb-4">
                  {gameOver ? t.game2048.gameOver : t.game2048.youWin}
                </p>
                <div className="flex gap-2">
                  <Button onClick={(e) => { e.stopPropagation(); handleNewGame(); }} data-testid="button-try-again">
                    {t.game2048.tryAgain}
                  </Button>
                  {won && (
                    <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleKeepPlaying(); }} data-testid="button-keep-playing">
                      {t.game2048.keepPlaying}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            {t.game2048.instructions}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            {t.game2048.swipeToMove}
          </p>
          
          <div className="flex justify-center gap-1 mt-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => handleMove('up')} className="touch-none">
              <ArrowUp className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex justify-center gap-1 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => handleMove('left')} className="touch-none">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleMove('down')} className="touch-none">
              <ArrowDown className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleMove('right')} className="touch-none">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {showPatternOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
          onClick={handleClosePatternOverlay}
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
                onPatternComplete={handlePatternComplete}
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
              onClick={handleClosePatternOverlay}
              className="text-muted-foreground"
              data-testid="button-cancel-pattern"
            >
              {t.game2048.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game2048;
