import { useState, useCallback, useMemo } from "react";
import { GAME, STORAGE_KEYS } from "@/lib/constants";

export type Grid = number[][];

export interface Position {
  row: number;
  col: number;
}

export interface MoveResult {
  grid: Grid;
  score: number;
  moved: boolean;
}

export function createEmptyGrid(): Grid {
  return Array(GAME.GRID_SIZE).fill(null).map(() => Array(GAME.GRID_SIZE).fill(0));
}

export function getRandomEmptyCell(grid: Grid): Position | null {
  const emptyCells: Position[] = [];
  for (let row = 0; row < GAME.GRID_SIZE; row++) {
    for (let col = 0; col < GAME.GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        emptyCells.push({ row, col });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

export function addRandomTile(grid: Grid): Grid {
  const newGrid = grid.map(row => [...row]);
  const pos = getRandomEmptyCell(newGrid);
  if (pos) {
    newGrid[pos.row][pos.col] = Math.random() < GAME.NEW_TILE_PROBABILITY_2 ? 2 : 4;
  }
  return newGrid;
}

export function initializeGrid(): Grid {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
}

export function rotateGrid(grid: Grid): Grid {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < GAME.GRID_SIZE; row++) {
    for (let col = 0; col < GAME.GRID_SIZE; col++) {
      newGrid[col][GAME.GRID_SIZE - 1 - row] = grid[row][col];
    }
  }
  return newGrid;
}

export function slideRow(row: number[]): { row: number[]; score: number } {
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
  
  while (newRow.length < GAME.GRID_SIZE) {
    newRow.push(0);
  }
  
  return { row: newRow, score };
}

export function moveLeft(grid: Grid): MoveResult {
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

export function move(grid: Grid, direction: 'left' | 'right' | 'up' | 'down'): MoveResult {
  let rotatedGrid = [...grid.map(row => [...row])];
  const rotations: Record<string, number> = { left: 0, up: 3, right: 2, down: 1 };
  
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

export function canMove(grid: Grid): boolean {
  for (let row = 0; row < GAME.GRID_SIZE; row++) {
    for (let col = 0; col < GAME.GRID_SIZE; col++) {
      if (grid[row][col] === 0) return true;
      if (col < GAME.GRID_SIZE - 1 && grid[row][col] === grid[row][col + 1]) return true;
      if (row < GAME.GRID_SIZE - 1 && grid[row][col] === grid[row + 1][col]) return true;
    }
  }
  return false;
}

export function hasWon(grid: Grid): boolean {
  for (let row = 0; row < GAME.GRID_SIZE; row++) {
    for (let col = 0; col < GAME.GRID_SIZE; col++) {
      if (grid[row][col] >= GAME.WINNING_TILE) return true;
    }
  }
  return false;
}

export interface UseGame2048Options {
  onActivity?: () => void;
}

export interface UseGame2048Return {
  grid: Grid;
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
  handleMove: (direction: 'left' | 'right' | 'up' | 'down') => void;
  handleNewGame: () => void;
  handleKeepPlaying: () => void;
}

export function useGame2048({ onActivity }: UseGame2048Options = {}): UseGame2048Return {
  const [grid, setGrid] = useState<Grid>(initializeGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GAME_BEST_SCORE);
    return saved ? parseInt(saved, 10) : 0;
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);

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
          localStorage.setItem(STORAGE_KEYS.GAME_BEST_SCORE, newScore.toString());
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

  return useMemo(() => ({
    grid,
    score,
    bestScore,
    gameOver,
    won,
    keepPlaying,
    handleMove,
    handleNewGame,
    handleKeepPlaying,
  }), [grid, score, bestScore, gameOver, won, keepPlaying, handleMove, handleNewGame, handleKeepPlaying]);
}
