import { Injectable } from '@angular/core';
import {
  CalcExercise,
  CoordsExercise,
  Exercise,
  MosaicExercise,
  SeriesExercise,
} from '../models/exercise.model';

@Injectable({
  providedIn: 'root',
})
export class ExerciseGeneratorService {
  // Genera una tanda balanceada de N ejercicios rotando por los 4 bloques
  generateSession(count: number = 8): Exercise[] {
    const exercises: Exercise[] = [];
    const types: ('calc' | 'mosaic' | 'series' | 'coords')[] = [
      'calc',
      'mosaic',
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

    // Generar opciones con distractores cercanos
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

  // 2. Mosaico 3x3 de memoria: 3 a 4 celdas negras aleatorias
  private generateMosaic(id: string): MosaicExercise {
    const numCells = 3 + Math.floor(Math.random() * 2); // 3 o 4 casillas
    const allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
    const targetCells = allIndices.slice(0, numCells).sort((a, b) => a - b);

    return {
      id,
      type: 'mosaic',
      title: 'Mosaico de Memoria',
      instructions: 'Memoriza la posición de los cuadros negros:',
      gridSize: 3,
      targetCells,
      memorizeSeconds: 5,
    };
  }

  // 3. Series visuales: alternancia de forma y variación de cantidad
  private generateSeries(id: string): SeriesExercise {
    // Ejemplo: □ | ○ | □□ | ○○ | □□□ | ...
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

    // El siguiente debe ser shape2 con 3
    const correctOption = { shape: shape2, count: 3 };

    const fakeOptions = [
      { shape: shape1, count: 3 }, // misma forma anterior (error común en Ona)
      { shape: shape2, count: 2 }, // forma correcta pero no incrementa
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
}
