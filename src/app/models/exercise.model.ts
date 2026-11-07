export type ExerciseType = 'calc' | 'mosaic' | 'series' | 'coords';

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
  gridSize: number; // 3 for 3x3
  targetCells: number[]; // indices 0 to 8
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

export type Exercise = CalcExercise | MosaicExercise | SeriesExercise | CoordsExercise;
