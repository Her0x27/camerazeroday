import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createEmptyGrid,
  getRandomEmptyCell,
  addRandomTile,
  initializeGrid,
  rotateGrid,
  slideRow,
  moveLeft,
  move,
  canMove,
  hasWon,
  Grid,
} from './use-game-2048';

describe('Game 2048 Logic', () => {
  describe('createEmptyGrid', () => {
    it('should create a 4x4 grid filled with zeros', () => {
      const grid = createEmptyGrid();
      expect(grid.length).toBe(4);
      expect(grid.every(row => row.length === 4)).toBe(true);
      expect(grid.flat().every(cell => cell === 0)).toBe(true);
    });
  });

  describe('getRandomEmptyCell', () => {
    it('should return a position with row and col for grid with empty cells', () => {
      const grid: Grid = [
        [2, 4, 2, 4],
        [4, 0, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const pos = getRandomEmptyCell(grid);
      expect(pos).toEqual({ row: 1, col: 1 });
    });

    it('should return null for a full grid', () => {
      const grid: Grid = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const pos = getRandomEmptyCell(grid);
      expect(pos).toBeNull();
    });

    it('should return one of the empty cells randomly', () => {
      const grid: Grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const pos = getRandomEmptyCell(grid);
      expect(pos).not.toBeNull();
      expect(pos!.row).toBeGreaterThanOrEqual(0);
      expect(pos!.row).toBeLessThan(4);
      expect(pos!.col).toBeGreaterThanOrEqual(0);
      expect(pos!.col).toBeLessThan(4);
    });
  });

  describe('addRandomTile', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mathRandomSpy = vi.spyOn(Math, 'random');
    });

    afterEach(() => {
      mathRandomSpy.mockRestore();
    });

    it('should add a 2 when random value is below 0.9', () => {
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.5);
      const grid: Grid = [
        [0, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const newGrid = addRandomTile(grid);
      expect(newGrid[0][0]).toBe(2);
    });

    it('should add a 4 when random value is 0.9 or above', () => {
      mathRandomSpy.mockReturnValueOnce(0.5).mockReturnValueOnce(0.95);
      const grid: Grid = [
        [0, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      const newGrid = addRandomTile(grid);
      expect(newGrid[0][0]).toBe(4);
    });

    it('should not mutate the original grid', () => {
      mathRandomSpy.mockReturnValue(0.5);
      const grid: Grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const originalGrid = JSON.parse(JSON.stringify(grid));
      addRandomTile(grid);
      expect(grid).toEqual(originalGrid);
    });
  });

  describe('initializeGrid', () => {
    it('should create a grid with exactly 2 non-zero tiles', () => {
      const grid = initializeGrid();
      const nonZeroCount = grid.flat().filter(cell => cell !== 0).length;
      expect(nonZeroCount).toBe(2);
    });

    it('should only have tiles with value 2 or 4', () => {
      const grid = initializeGrid();
      const nonZeroCells = grid.flat().filter(cell => cell !== 0);
      expect(nonZeroCells.every(cell => cell === 2 || cell === 4)).toBe(true);
    });
  });

  describe('rotateGrid', () => {
    it('should rotate the grid 90 degrees clockwise', () => {
      const grid: Grid = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ];
      const rotated = rotateGrid(grid);
      expect(rotated).toEqual([
        [13, 9, 5, 1],
        [14, 10, 6, 2],
        [15, 11, 7, 3],
        [16, 12, 8, 4],
      ]);
    });

    it('should return original after 4 rotations', () => {
      const grid: Grid = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ];
      let rotated = grid;
      for (let i = 0; i < 4; i++) {
        rotated = rotateGrid(rotated);
      }
      expect(rotated).toEqual(grid);
    });

    it('should not mutate the original grid', () => {
      const grid: Grid = [
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16],
      ];
      const originalGrid = JSON.parse(JSON.stringify(grid));
      rotateGrid(grid);
      expect(grid).toEqual(originalGrid);
    });
  });

  describe('slideRow', () => {
    it('should slide tiles to the left', () => {
      const { row } = slideRow([0, 2, 0, 2]);
      expect(row).toEqual([4, 0, 0, 0]);
    });

    it('should merge adjacent equal tiles', () => {
      const { row, score } = slideRow([2, 2, 4, 4]);
      expect(row).toEqual([4, 8, 0, 0]);
      expect(score).toBe(12);
    });

    it('should not merge tiles that are not adjacent after slide', () => {
      const { row } = slideRow([2, 0, 2, 2]);
      expect(row).toEqual([4, 2, 0, 0]);
    });

    it('should calculate correct score for merges', () => {
      const { score } = slideRow([4, 4, 4, 4]);
      expect(score).toBe(16);
    });

    it('should handle empty row', () => {
      const { row, score } = slideRow([0, 0, 0, 0]);
      expect(row).toEqual([0, 0, 0, 0]);
      expect(score).toBe(0);
    });

    it('should handle row with no possible merges', () => {
      const { row, score } = slideRow([2, 4, 8, 16]);
      expect(row).toEqual([2, 4, 8, 16]);
      expect(score).toBe(0);
    });
  });

  describe('moveLeft', () => {
    it('should move all tiles left', () => {
      const grid: Grid = [
        [0, 2, 0, 2],
        [2, 0, 2, 0],
        [0, 0, 0, 4],
        [4, 4, 0, 0],
      ];
      const { grid: newGrid, score, moved } = moveLeft(grid);
      expect(newGrid).toEqual([
        [4, 0, 0, 0],
        [4, 0, 0, 0],
        [4, 0, 0, 0],
        [8, 0, 0, 0],
      ]);
      expect(score).toBe(16);
      expect(moved).toBe(true);
    });

    it('should return moved=false when no movement possible', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2, 4],
        [8, 16, 32, 64],
      ];
      const { moved } = moveLeft(grid);
      expect(moved).toBe(false);
    });
  });

  describe('move', () => {
    it('should move tiles in the specified direction - left', () => {
      const grid: Grid = [
        [0, 2, 0, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { grid: newGrid } = move(grid, 'left');
      expect(newGrid[0]).toEqual([4, 0, 0, 0]);
    });

    it('should move tiles in the specified direction - right', () => {
      const grid: Grid = [
        [2, 2, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { grid: newGrid } = move(grid, 'right');
      expect(newGrid[0]).toEqual([0, 0, 0, 4]);
    });

    it('should move tiles in the specified direction - up', () => {
      const grid: Grid = [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [2, 0, 0, 0],
        [2, 0, 0, 0],
      ];
      const { grid: newGrid, moved, score } = move(grid, 'up');
      expect(moved).toBe(true);
      expect(score).toBe(4);
      expect(newGrid[0][0]).toBe(4);
      expect(newGrid[1][0]).toBe(0);
      expect(newGrid[2][0]).toBe(0);
      expect(newGrid[3][0]).toBe(0);
    });

    it('should move tiles in the specified direction - down', () => {
      const grid: Grid = [
        [2, 0, 0, 0],
        [2, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const { grid: newGrid, moved, score } = move(grid, 'down');
      expect(moved).toBe(true);
      expect(score).toBe(4);
      expect(newGrid[0][0]).toBe(0);
      expect(newGrid[1][0]).toBe(0);
      expect(newGrid[2][0]).toBe(0);
      expect(newGrid[3][0]).toBe(4);
    });
  });

  describe('canMove', () => {
    it('should return true if there are empty cells', () => {
      const grid: Grid = [
        [2, 4, 2, 4],
        [4, 0, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      expect(canMove(grid)).toBe(true);
    });

    it('should return true if there are adjacent equal cells horizontally', () => {
      const grid: Grid = [
        [2, 2, 4, 8],
        [4, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 128],
      ];
      expect(canMove(grid)).toBe(true);
    });

    it('should return true if there are adjacent equal cells vertically', () => {
      const grid: Grid = [
        [2, 4, 8, 16],
        [2, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 128],
      ];
      expect(canMove(grid)).toBe(true);
    });

    it('should return false if no moves possible', () => {
      const grid: Grid = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      expect(canMove(grid)).toBe(false);
    });
  });

  describe('hasWon', () => {
    it('should return true if 2048 tile exists', () => {
      const grid: Grid = [
        [2048, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      expect(hasWon(grid)).toBe(true);
    });

    it('should return true if tile greater than 2048 exists', () => {
      const grid: Grid = [
        [4096, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      expect(hasWon(grid)).toBe(true);
    });

    it('should return false if no tile >= 2048', () => {
      const grid: Grid = [
        [1024, 512, 256, 128],
        [64, 32, 16, 8],
        [4, 2, 0, 0],
        [0, 0, 0, 0],
      ];
      expect(hasWon(grid)).toBe(false);
    });
  });
});
