import { Injectable } from '@angular/core';
import {
  CalcExercise,
  CoordsExercise,
  CryptoExercise,
  Exercise,
  ExerciseType,
  MosaicExercise,
  SeriesExercise,
  SeriesItem,
  SudokuExercise,
} from '../models/exercise.model';

@Injectable({
  providedIn: 'root',
})
export class ExerciseGeneratorService {
  private readonly shapes = ['●', '■', '▲', '★'];
  private readonly shapeNames: Record<string, string> = {
    '●': 'círculos',
    '■': 'cuadrados',
    '▲': 'triángulos',
    '★': 'estrellas',
  };

  private readonly colors = [
    { code: '#2563eb', name: 'azul' },
    { code: '#dc2626', name: 'rojo' },
    { code: '#16a34a', name: 'verde' },
    { code: '#d97706', name: 'naranja' },
    { code: '#9333ea', name: 'morado' },
    { code: '#0f172a', name: 'negro' },
  ];

  generateSession(count: number = 10, enabledTypes?: ExerciseType[]): Exercise[] {
    const exercises: Exercise[] = [];
    const availableTypes = (enabledTypes && enabledTypes.length > 0)
      ? enabledTypes
      : (['calc', 'mosaic', 'sudoku', 'series', 'coords', 'crypto'] as ExerciseType[]);

    for (let i = 0; i < count; i++) {
      const type = availableTypes[i % availableTypes.length];
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
        case 'crypto':
          exercises.push(this.generateCrypto(id));
          break;
      }
    }

    return exercises;
  }

  // 1. Cálculo
  private generateCalc(id: string): CalcExercise {
    const mode = Math.floor(Math.random() * 3);
    let opText = '';
    let correct = 0;

    if (mode === 0) {
      const a = 2 + Math.floor(Math.random() * 3); // 2, 3, 4
      const b = 1 + Math.floor(Math.random() * 9);
      correct = a * b;
      opText = `${a} × ${b}`;
    } else if (mode === 1) {
      const a = 3 + Math.floor(Math.random() * 8);
      const b = 2 + Math.floor(Math.random() * 8);
      correct = a + b;
      opText = `${a} + ${b}`;
    } else {
      const a = 5 + Math.floor(Math.random() * 6);
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

    return {
      id,
      type: 'calc',
      title: 'Cálculo',
      instructions: 'Calcula el resultado:',
      operationText: opText,
      correctAnswer: correct,
      options: Array.from(optionsSet).sort(() => Math.random() - 0.5),
    };
  }

  // 2. Mosaico 4x4
  private generateMosaic(id: string): MosaicExercise {
    const numCells = 5 + Math.floor(Math.random() * 2);
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

  // 3. Series Visuales Procedurales con variación de forma, cantidad y color
  private generateSeries(id: string): SeriesExercise {
    // Seleccionar 2 formas y 2 colores distintos
    const chosenShapes = [...this.shapes].sort(() => Math.random() - 0.5).slice(0, 2);
    const chosenColors = [...this.colors].sort(() => Math.random() - 0.5).slice(0, 2);

    const shapeA = chosenShapes[0];
    const shapeB = chosenShapes[1];
    const colorA = chosenColors[0];
    const colorB = chosenColors[1];

    // Regla de cantidad:
    // 0: Creciente clásica (1, 1, 2, 2, 3...)
    // 1: Decreciente (4, 4, 3, 3, 2...)
    // 2: Cíclica (1, 2, 1, 2, 1...)
    // 3: Creciente rápida (1, 2, 3, 4, 5...)
    const qtyPattern = Math.floor(Math.random() * 4);

    let getCountAt = (stepIndex: number): number => {
      switch (qtyPattern) {
        case 0: // Creciente en parejas: 1, 1, 2, 2, 3 -> ? 3
          return Math.floor(stepIndex / 2) + 1;
        case 1: // Decreciente en parejas: 4, 4, 3, 3, 2 -> ? 2
          return Math.max(1, 4 - Math.floor(stepIndex / 2));
        case 2: // Cíclico alterno: 1, 2, 1, 2, 1 -> ? 2
          return (stepIndex % 2) + 1;
        case 3: // Creciente directo: 1, 2, 3, 4 -> ? 5
          return stepIndex + 1;
        default:
          return Math.floor(stepIndex / 2) + 1;
      }
    };

    // Regla de color y forma:
    // 0: Forma y color cambian juntos (shapeA+colorA, shapeB+colorB)
    // 1: Forma constante, cambia color y cantidad (shapeA+colorA, shapeA+colorB...)
    // 2: Color constante, cambian formas y cantidad
    const traitMode = Math.floor(Math.random() * 3);

    const getItemAt = (idx: number): SeriesItem => {
      const count = getCountAt(idx);
      if (traitMode === 0) {
        // Alternan forma y color a la vez
        const isB = idx % 2 === 1;
        return {
          shape: isB ? shapeB : shapeA,
          count,
          color: isB ? colorB.code : colorA.code,
          colorName: isB ? colorB.name : colorA.name,
        };
      } else if (traitMode === 1) {
        // Misma forma, alternan colores
        const isB = idx % 2 === 1;
        return {
          shape: shapeA,
          count,
          color: isB ? colorB.code : colorA.code,
          colorName: isB ? colorB.name : colorA.name,
        };
      } else {
        // Mismo color, alternan formas
        const isB = idx % 2 === 1;
        return {
          shape: isB ? shapeB : shapeA,
          count,
          color: colorA.code,
          colorName: colorA.name,
        };
      }
    };

    // Longitud visible de la serie antes de la incógnita: 4 o 5 elementos
    const visibleLength = 4;
    const sequence: SeriesItem[] = [];
    for (let i = 0; i < visibleLength; i++) {
      sequence.push(getItemAt(i));
    }

    // Elemento correcto siguiente (índice visibleLength)
    const correctOption = getItemAt(visibleLength);

    // Opciones distractoras
    // Distractor 1: Forma o color equivocado
    const fake1: SeriesItem = {
      shape: correctOption.shape === shapeA ? shapeB : shapeA,
      count: correctOption.count,
      color: correctOption.color === colorA.code ? colorB.code : colorA.code,
      colorName: correctOption.colorName === colorA.name ? colorB.name : colorA.name,
    };

    // Distractor 2: Cantidad errónea (+1 o -1)
    const fake2: SeriesItem = {
      shape: correctOption.shape,
      count: Math.max(1, correctOption.count + (correctOption.count > 1 ? -1 : 1)),
      color: correctOption.color,
      colorName: correctOption.colorName,
    };

    const options = [correctOption, fake1, fake2].sort(() => Math.random() - 0.5);

    let hint = '';
    if (traitMode === 0) {
      hint = `Fíjate en cómo alternan la figura y el color, y cómo varía la cantidad.`;
    } else if (traitMode === 1) {
      hint = `La figura es siempre la misma; fíjate en el cambio de color y en la cantidad.`;
    } else {
      hint = `El color no cambia; observa cómo cambian la figura y el número de elementos.`;
    }

    return {
      id,
      type: 'series',
      title: 'Series Visuales',
      instructions: '¿Qué figura, color y cantidad continúa la serie?',
      sequence,
      correctOption,
      options,
      ruleHint: hint,
    };
  }

  // 4. Coordenadas 8x8
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

  // 6. Criptograma numérico / Código secreto
  private generateCrypto(id: string): CryptoExercise {
    const symbolsPool = ['★', '▲', '●', '■', '◆', '✦'].sort(() => Math.random() - 0.5);
    const chosen = symbolsPool.slice(0, 3);

    // Asignar valores numéricos únicos a los 3 símbolos (1 a 9)
    const valuesPool = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const codeTable = [
      { symbol: chosen[0], value: valuesPool[0] },
      { symbol: chosen[1], value: valuesPool[1] },
      { symbol: chosen[2], value: valuesPool[2] },
    ];

    // Operación: puede ser símbolo + símbolo o símbolo - símbolo o símbolo × símbolo
    const opType = Math.floor(Math.random() * 3); // 0: suma, 1: resta, 2: mult
    let s1 = codeTable[0];
    let s2 = codeTable[1];
    let opSymbol = '+';
    let correct = 0;

    if (opType === 0) {
      opSymbol = '+';
      correct = s1.value + s2.value;
    } else if (opType === 1) {
      opSymbol = '−';
      if (s1.value < s2.value) {
        [s1, s2] = [s2, s1];
      }
      correct = s1.value - s2.value;
    } else {
      // Multiplicación acotada (ej. factores de 2 a 4)
      opSymbol = '×';
      s1.value = 2 + Math.floor(Math.random() * 3);
      s2.value = 1 + Math.floor(Math.random() * 5);
      correct = s1.value * s2.value;
    }

    const optionsSet = new Set<number>([correct]);
    while (optionsSet.size < 3) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
      const fake = Math.max(0, correct + delta);
      optionsSet.add(fake);
    }

    return {
      id,
      type: 'crypto',
      title: 'Código Secreto',
      instructions: 'Consulta la tabla y descifra la operación:',
      codeTable,
      expressionSymbols: [s1.symbol, opSymbol, s2.symbol],
      correctAnswer: correct,
      options: Array.from(optionsSet).sort(() => Math.random() - 0.5),
    };
  }
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

    // Comenzar con el tablero completo y remover casillas manteniendo solución única
    const grid: (number | null)[] = [...solution];
    const cellOrder = Array.from({ length: 16 }, (_, i) => i).sort(() => Math.random() - 0.5);

    for (const cellIdx of cellOrder) {
      const originalValue = grid[cellIdx];
      grid[cellIdx] = null;

      // Verificar si al quitar esta casilla sigue teniendo exactamente 1 solución
      if (this.countSudokuSolutions(grid) !== 1) {
        // Si pierde unicidad, restaurar el número como pista dada obligatoria
        grid[cellIdx] = originalValue;
      }
    }

    const initialGiven = grid.map((val) => val !== null);

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

  // Solucionador exhaustivo de backtracking para validar unicidad (para cuando soluciones > 1)
  private countSudokuSolutions(grid: (number | null)[]): number {
    let solutionsCount = 0;

    const isValid = (current: (number | null)[], index: number, num: number): boolean => {
      const r = Math.floor(index / 4);
      const c = index % 4;

      // Comprobar fila y columna
      for (let i = 0; i < 4; i++) {
        if (current[r * 4 + i] === num) return false;
        if (current[i * 4 + c] === num) return false;
      }

      // Comprobar caja 2x2
      const boxStartRow = Math.floor(r / 2) * 2;
      const boxStartCol = Math.floor(c / 2) * 2;
      for (let br = 0; br < 2; br++) {
        for (let bc = 0; bc < 2; bc++) {
          if (current[(boxStartRow + br) * 4 + (boxStartCol + bc)] === num) {
            return false;
          }
        }
      }

      return true;
    };

    const solve = (current: (number | null)[], index: number): void => {
      if (solutionsCount > 1) return; // Salida temprana si ya hay más de una solución

      if (index === 16) {
        solutionsCount++;
        return;
      }

      if (current[index] !== null) {
        solve(current, index + 1);
        return;
      }

      for (let n = 1; n <= 4; n++) {
        if (isValid(current, index, n)) {
          current[index] = n;
          solve(current, index + 1);
          current[index] = null;
        }
      }
    };

    solve([...grid], 0);
    return solutionsCount;
  }
}
