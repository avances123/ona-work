export type ExerciseType = 'calc' | 'mosaic' | 'series' | 'coords' | 'sudoku';

export interface BaseExercise {
  id: string;
  type: ExerciseType;
  title: string;
  instructions: string;
}

export interface CalcExercise extends BaseExercise {
  type: 'calc';
  operationText: string;
  correctAnswer: number;
  options: number[];
  discardedOption?: number;
}

export interface MosaicExercise extends BaseExercise {
  type: 'mosaic';
  gridSize: number; // 4 for 4x4 (16 cells)
  targetCells: number[]; // indices 0 to 15
  memorizeSeconds: number; // 5 seconds
}

export interface SeriesExercise extends BaseExercise {
  type: 'series';
  sequence: { shape: string; count: number }[];
  correctOption: { shape: string; count: number };
  options: { shape: string; count: number }[];
  ruleHint?: string;
}

export interface CoordsExercise extends BaseExercise {
  type: 'coords';
  column: string; // 'a' to 'h'
  row: number; // 1 to 8
  highlightAxis?: 'col' | 'row';
}

export interface SudokuExercise extends BaseExercise {
  type: 'sudoku';
  grid: (number | null)[]; // 16 cells (4x4)
  solution: number[]; // 16 cells
  initialGiven: boolean[]; // 16 flags
  highlightedRow?: number;
  highlightedCol?: number;
}

export type Exercise =
  | CalcExercise
  | MosaicExercise
  | SeriesExercise
  | CoordsExercise
  | SudokuExercise;

