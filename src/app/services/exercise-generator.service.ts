import { Injectable } from '@angular/core';
import {
  CalcExercise,
  CoordsExercise,
  Exercise,
  MosaicExercise,
  SeriesExercise,
  SudokuExercise,
} from '../models/exercise.model';

@Injectable({
  providedIn: 'root',
})
export class ExerciseGeneratorService {
  // Genera una tanda balanceada de N ejercicios rotando por los 5 bloques
  generateSession(count: number = 10): Exercise[] {
    const exercises: Exercise[] = [];
    const types: ('calc' | 'mosaic' | 'sudoku' | 'series' | 'coords')[] = [
      'calc',
      'mosaic',
      'sudoku',
      'series',
      'coords',
    ];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const id = `ex-${Date.now()}-${i}`;

      switch (type) {
        case 'calc':
          exercises.push(this.generateCalc(id));
          break;
        case 'mosaic':
          exercises.push(this.generateMosaic(id));
          break;
        case 'series':
          exercises.push(this.generateSeries(id));
          break;
        case 'coords':
          exercises.push(this.generateCoords(id));
          break;
        case 'sudoku':
          exercises.push(this.generateSudoku(id));
          break;
      }
    }

    return exercises;
  }

  // 1. Cálculo: sumas (hasta 20), restas (hasta 10) o multiplicaciones (tablas 1 a 4)
  private generateCalc(id: string): CalcExercise {
    const mode = Math.floor(Math.random() * 3); // 0: mult, 1: suma, 2: resta
    let opText = '';
    let correct = 0;

    if (mode === 0) {
      // Multiplicación: tablas del 2, 3 y 4
      const a = 2 + Math.floor(Math.random() * 3); // 2, 3, 4
      const b = 1 + Math.floor(Math.random() * 9); // 1 a 9
      correct = a * b;
      opText = `${a} × ${b}`;
    } else if (mode === 1) {
      // Suma hasta 20
      const a = 3 + Math.floor(Math.random() * 8);
      const b = 2 + Math.floor(Math.random() * 8);
      correct = a + b;
      opText = `${a} + ${b}`;
    } else {
      // Resta hasta 10
      const a = 5 + Math.floor(Math.random() * 6); // 5 a 10
      const b = 1 + Math.floor(Math.random() * a);
      correct = a - b;
      opText = `${a} − ${b}`;
    }

    const optionsSet = new Set<number>([correct]);
    while (optionsSet.size < 3) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
      const fake = Math.max(0, correct + delta);
      optionsSet.add(fake);
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);

    return {
      id,
      type: 'calc',
      title: 'Cálculo',
      instructions: 'Calcula el resultado:',
      operationText: opText,
      correctAnswer: correct,
      options,
    };
  }

  // 2. Mosaico 4x4 de memoria: 5 a 6 casillas negras sobre 16 posibles
  private generateMosaic(id: string): MosaicExercise {
    const numCells = 5 + Math.floor(Math.random() * 2); // 5 o 6 casillas
    const allIndices = Array.from({ length: 16 }, (_, i) => i).sort(() => Math.random() - 0.5);
    const targetCells = allIndices.slice(0, numCells).sort((a, b) => a - b);

    return {
      id,
      type: 'mosaic',
      title: 'Mosaico de Memoria 4×4',
      instructions: 'Memoriza la posición de los cuadros negros (4×4):',
      gridSize: 4,
      targetCells,
      memorizeSeconds: 5,
    };
  }

  // 3. Series visuales: alternancia de forma y variación de cantidad
  private generateSeries(id: string): SeriesExercise {
    const shapes = ['■', '●', '▲'].sort(() => Math.random() - 0.5);
    const shape1 = shapes[0];
    const shape2 = shapes[1];

    const sequence = [
      { shape: shape1, count: 1 },
      { shape: shape2, count: 1 },
      { shape: shape1, count: 2 },
      { shape: shape2, count: 2 },
      { shape: shape1, count: 3 },
    ];

    const correctOption = { shape: shape2, count: 3 };

    const fakeOptions = [
      { shape: shape1, count: 3 },
      { shape: shape2, count: 2 },
    ];

    const options = [correctOption, ...fakeOptions].sort(() => Math.random() - 0.5);

    return {
      id,
      type: 'series',
      title: 'Series Visuales',
      instructions: '¿Qué figura y cantidad continúa la serie?',
      sequence,
      correctOption,
      options,
      ruleHint: `Fíjate en cómo alternan ${shape1} y ${shape2}, y cómo aumentan en parejas.`,
    };
  }

  // 4. Coordenadas 8x8 de ajedrez (a-h, 1-8)
  private generateCoords(id: string): CoordsExercise {
    const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const col = cols[Math.floor(Math.random() * cols.length)];
    const row = 1 + Math.floor(Math.random() * 8);

    return {
      id,
      type: 'coords',
      title: 'Coordenadas del Tablero',
      instructions: `Busca y toca la casilla:`,
      column: col,
      row,
    };
  }

  // 5. Sudoku 4x4 procedural
  private generateSudoku(id: string): SudokuExercise {
    const base = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1],
    ];

    const symbols = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
    const mapped = base.map((row) => row.map((val) => symbols[val - 1]));

    if (Math.random() > 0.5) {
      [mapped[0], mapped[1]] = [mapped[1], mapped[0]];
    }
    if (Math.random() > 0.5) {
      [mapped[2], mapped[3]] = [mapped[3], mapped[2]];
    }

    const solution: number[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        solution.push(mapped[r][c]);
      }
    }

    // 7 u 8 pistas dadas
    const numGiven = 7 + Math.floor(Math.random() * 2);
    const indices = Array.from({ length: 16 }, (_, i) => i).sort(() => Math.random() - 0.5);
    const givenIndices = new Set(indices.slice(0, numGiven));

    const grid: (number | null)[] = solution.map((val, idx) =>
      givenIndices.has(idx) ? val : null
    );
    const initialGiven: boolean[] = solution.map((_, idx) => givenIndices.has(idx));

    return {
      id,
      type: 'sudoku',
      title: 'Sudoku 4×4',
      instructions: 'Rellena las casillas vacías con números del 1 al 4:',
      grid,
      solution,
      initialGiven,
    };
  }
}
