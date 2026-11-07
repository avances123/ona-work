import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusTimerService } from './services/focus-timer.service';
import { StorageService } from './services/storage.service';
import { ExerciseGeneratorService } from './services/exercise-generator.service';
import {
  CalcExercise,
  CoordsExercise,
  Exercise,
  MosaicExercise,
  SeriesExercise,
  SeriesItem,
  SudokuExercise,
} from './models/exercise.model';
import { ExerciseResult, SessionRecord } from './models/session.model';
import { ParentDashboardComponent } from './components/parent-dashboard/parent-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ParentDashboardComponent],
  template: `
    <main class="app-container">
      <!-- Barra superior discreta -->
      <header class="top-bar">
        <div class="progress-info">
          <span class="exercise-indicator">
            Ejercicio {{ currentExerciseIndex() + 1 }} de {{ exercises().length }}
          </span>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
          </div>
        </div>
      </header>

      <!-- Zona de trabajo principal -->
      <section class="workspace">
        <div *ngIf="!sessionFinished(); else finishedTemplate" class="exercise-card">
          <!-- Cabecera del ejercicio -->
          <span class="exercise-type-tag">{{ currentExercise().title }}</span>
          <h2 class="exercise-instructions">{{ currentExercise().instructions }}</h2>

          <!-- 1. BLOQUE CÁLCULO -->
          <div *ngIf="currentExercise().type === 'calc'" class="calc-block">
            <div class="prompt-text">{{ asCalc(currentExercise()).operationText }} = ?</div>
            <div class="options-grid">
              <button
                *ngFor="let opt of asCalc(currentExercise()).options"
                class="option-btn"
                [disabled]="opt === asCalc(currentExercise()).discardedOption"
                [class.discarded]="opt === asCalc(currentExercise()).discardedOption"
                (click)="onCalcAnswer(opt)"
              >
                {{ opt }}
              </button>
            </div>
          </div>

          <!-- 2. BLOQUE MOSAICO 4x4 (16 celdas) -->
          <div *ngIf="currentExercise().type === 'mosaic'" class="mosaic-block">
            <!-- Fase Memorizar (5s) -->
            <div *ngIf="mosaicPhase() === 'memorize'" class="mosaic-phase-memorize">
              <div class="mosaic-countdown">👀 Memoriza: {{ memorizeCountdown() }}s</div>
              <div class="mosaic-grid-4x4">
                <div
                  *ngFor="let cell of mosaicCells16"
                  class="mosaic-cell preview"
                  [class.filled]="isTargetCell(cell)"
                ></div>
              </div>
            </div>

            <!-- Fase Reproducir -->
            <div *ngIf="mosaicPhase() === 'recall'" class="mosaic-phase-recall">
              <div class="mosaic-grid-4x4">
                <button
                  *ngFor="let cell of mosaicCells16"
                  class="mosaic-cell interactive"
                  [class.filled]="selectedCells().includes(cell)"
                  [class.flash]="isFlashingHint() && isTargetCell(cell)"
                  (click)="toggleMosaicCell(cell)"
                ></button>
              </div>
              <button class="check-btn" (click)="onMosaicSubmit()">Comprobar</button>
            </div>
          </div>

          <!-- 3. BLOQUE SERIES VISUALES -->
          <div *ngIf="currentExercise().type === 'series'" class="series-block">
            <div class="series-sequence">
              <div
                *ngFor="let item of asSeries(currentExercise()).sequence; let last = last"
                class="series-item"
              >
                <span class="shape-symbol" [style.color]="item.color">{{ repeatShape(item.shape, item.count) }}</span>
                <span *ngIf="!last" class="series-sep">|</span>
              </div>
              <span class="series-sep">|</span>
              <span class="series-unknown">?</span>
            </div>

            <div *ngIf="seriesHintActive()" class="socratic-hint-banner">
              💡 {{ asSeries(currentExercise()).ruleHint }}
            </div>

            <div class="series-options">
              <button
                *ngFor="let opt of asSeries(currentExercise()).options"
                class="series-option-btn"
                (click)="onSeriesAnswer(opt)"
              >
                <span [style.color]="opt.color">{{ repeatShape(opt.shape, opt.count) }}</span>
              </button>
            </div>
          </div>

          <!-- 4. BLOQUE COORDENADAS 8x8 -->
          <div *ngIf="currentExercise().type === 'coords'" class="coords-block">
            <div class="coords-target-badge">
              Casilla: <strong>{{ asCoords(currentExercise()).column.toUpperCase() }}{{ asCoords(currentExercise()).row }}</strong>
            </div>

            <div class="chess-board">
              <div class="coords-header-row">
                <span class="corner-spacer"></span>
                <span *ngFor="let c of cols" class="col-label">{{ c }}</span>
              </div>

              <div *ngFor="let r of rows" class="board-row">
                <span class="row-label">{{ r }}</span>
                <button
                  *ngFor="let c of cols"
                  class="chess-cell"
                  [class.dark]="(colIndex(c) + r) % 2 === 0"
                  [class.highlight-axis]="isCoordsAxisHighlighted(c, r)"
                  (click)="onCoordsClick(c, r)"
                ></button>
              </div>
            </div>
          </div>

          <!-- 5. BLOQUE SUDOKU 4x4 -->
          <div *ngIf="currentExercise().type === 'sudoku'" class="sudoku-block">
            <div class="sudoku-board-4x4">
              <div
                *ngFor="let cellIdx of mosaicCells16"
                class="sudoku-cell"
                [class.given]="asSudoku(currentExercise()).initialGiven[cellIdx]"
                [class.selected]="selectedSudokuCell() === cellIdx"
                [class.thick-border-right]="cellIdx % 4 === 1"
                [class.thick-border-bottom]="cellIdx >= 4 && cellIdx <= 7"
                (click)="selectSudokuCell(cellIdx)"
              >
                {{ sudokuCurrentGrid()[cellIdx] || '' }}
              </div>
            </div>

            <!-- Teclado de números para rellenar (1..4 y borrar) -->
            <div class="sudoku-keypad">
              <button
                *ngFor="let num of [1, 2, 3, 4]"
                class="keypad-btn"
                (click)="inputSudokuNumber(num)"
              >
                {{ num }}
              </button>
              <button class="keypad-btn erase-btn" (click)="inputSudokuNumber(null)">⌫</button>
            </div>

            <button class="check-btn" (click)="onSudokuSubmit()">Comprobar Sudoku</button>
          </div>

          <!-- Feedback de error suave socrático -->
          <div *ngIf="socraticFeedback()" class="error-notice">
            <span>¡Casi! Inténtalo de nuevo con la pista.</span>
          </div>
        </div>

        <!-- Pantalla de final de sesión -->
        <ng-template #finishedTemplate>
          <div class="finished-card">
            <div class="star-icon">⭐</div>
            <h2>¡Sesión completada, Ona!</h2>
            <p>Has completado todos los ejercicios con mucha concentración.</p>
            <button class="restart-btn" (click)="restartSession()">Hacer otra tanda</button>
          </div>
        </ng-template>
      </section>

      <!-- Overlay suave de inactividad (60 segundos) -->
      <div *ngIf="timer.isIdle()" class="idle-overlay" (click)="timer.resumeFromIdle()">
        <div class="idle-box">
          <div class="idle-icon">🌱</div>
          <h2>¡Ánimo, seguimos concentradas!</h2>
          <p>Toca la pantalla o mueve el ratón para continuar.</p>
          <button class="continue-btn" (click)="timer.resumeFromIdle()">Continuar</button>
        </div>
      </div>

      <!-- Panel de supervisión para Papá -->
      <app-parent-dashboard
        *ngIf="showDashboard()"
        (closed)="showDashboard.set(false)"
        (restartRequested)="restartSession()"
        (continueRequested)="continueSessionWithFilter()"
      ></app-parent-dashboard>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #f8fafc;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #0f172a;
      }
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;
      }
      .top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 28px;
        background: #ffffff;
        border-bottom: 2px solid #e2e8f0;
        gap: 20px;
      }
      .progress-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        max-width: 500px;
      }
      .exercise-indicator {
        font-weight: 700;
        font-size: 1.1rem;
        color: #334155;
        white-space: nowrap;
      }
      .progress-track {
        flex: 1;
        height: 12px;
        background: #e2e8f0;
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        background: #22c55e;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .secret-dashboard-btn {
        background: none;
        border: none;
        font-size: 1.3rem;
        cursor: pointer;
        opacity: 0.35;
        transition: opacity 0.2s;
        padding: 4px;
      }
      .secret-dashboard-btn:hover {
        opacity: 1;
      }
      .workspace {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
      }
      .exercise-card {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 24px;
        padding: 32px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        max-width: 680px;
        width: 100%;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .exercise-type-tag {
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #2563eb;
        background: #eff6ff;
        padding: 4px 12px;
        border-radius: 20px;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }
      .exercise-instructions {
        font-size: 1.3rem;
        color: #334155;
        margin: 0 0 20px 0;
      }

      /* Cálculo */
      .prompt-text {
        font-size: 3.2rem;
        font-weight: 800;
        margin-bottom: 24px;
        color: #0f172a;
      }
      .options-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        width: 100%;
      }
      .option-btn {
        background: #f8fafc;
        border: 2px solid #cbd5e1;
        border-radius: 16px;
        padding: 18px;
        font-size: 2.2rem;
        font-weight: 800;
        color: #0f172a;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
      }
      .option-btn:hover:not(:disabled) {
        background: #f1f5f9;
        border-color: #3b82f6;
        transform: translateY(-2px);
      }
      .option-btn.discarded {
        opacity: 0.25;
        cursor: not-allowed;
        background: #f1f5f9;
        text-decoration: line-through;
      }

      /* Mosaicos 4x4 */
      .mosaic-countdown {
        font-size: 1.2rem;
        font-weight: 700;
        color: #0284c7;
        margin-bottom: 14px;
      }
      .mosaic-grid-4x4 {
        display: grid;
        grid-template-columns: repeat(4, 64px);
        grid-template-rows: repeat(4, 64px);
        gap: 8px;
        margin: 0 auto 20px auto;
      }
      .mosaic-cell {
        border-radius: 10px;
        border: 2px solid #cbd5e1;
        background: #f8fafc;
        transition: all 0.15s;
      }
      .mosaic-cell.filled {
        background: #0f172a;
        border-color: #0f172a;
      }
      .mosaic-cell.interactive {
        cursor: pointer;
      }
      .mosaic-cell.interactive:hover {
        border-color: #3b82f6;
      }
      .mosaic-cell.flash {
        animation: pulseFlash 0.5s ease-in-out 2;
      }
      @keyframes pulseFlash {
        0% { background: #f8fafc; }
        50% { background: #38bdf8; }
        100% { background: #f8fafc; }
      }
      .check-btn {
        background: #2563eb;
        color: #ffffff;
        border: none;
        padding: 12px 32px;
        font-size: 1.15rem;
        font-weight: 700;
        border-radius: 14px;
        cursor: pointer;
        margin-top: 10px;
      }

      /* Series */
      .series-sequence {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        font-size: 2.2rem;
        margin-bottom: 24px;
        flex-wrap: wrap;
      }
      .series-sep {
        color: #94a3b8;
        font-weight: 300;
      }
      .series-unknown {
        background: #eff6ff;
        border: 2px dashed #3b82f6;
        border-radius: 12px;
        padding: 4px 16px;
        color: #2563eb;
        font-weight: 800;
      }
      .socratic-hint-banner {
        background: #fef3c7;
        color: #92400e;
        padding: 10px 16px;
        border-radius: 12px;
        margin-bottom: 20px;
        font-size: 1rem;
        font-weight: 500;
      }
      .series-options {
        display: flex;
        gap: 16px;
        justify-content: center;
        width: 100%;
      }
      .series-option-btn {
        flex: 1;
        background: #f8fafc;
        border: 2px solid #cbd5e1;
        border-radius: 16px;
        padding: 16px;
        font-size: 2rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .series-option-btn:hover {
        border-color: #3b82f6;
        background: #f1f5f9;
        transform: translateY(-2px);
      }

      /* Coordenadas */
      .coords-target-badge {
        font-size: 1.4rem;
        color: #0f172a;
        background: #f1f5f9;
        padding: 8px 20px;
        border-radius: 20px;
        margin-bottom: 16px;
      }
      .chess-board {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .coords-header-row,
      .board-row {
        display: flex;
        align-items: center;
      }
      .corner-spacer,
      .row-label {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        color: #64748b;
      }
      .col-label {
        width: 38px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.9rem;
        color: #64748b;
        text-transform: uppercase;
      }
      .chess-cell {
        width: 38px;
        height: 38px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        cursor: pointer;
        transition: all 0.1s;
      }
      .chess-cell.dark {
        background: #cbd5e1;
      }
      .chess-cell:hover {
        outline: 2px solid #2563eb;
        z-index: 2;
      }
      .chess-cell.highlight-axis {
        background: #fde047 !important;
      }

      /* Sudoku 4x4 */
      .sudoku-board-4x4 {
        display: grid;
        grid-template-columns: repeat(4, 58px);
        grid-template-rows: repeat(4, 58px);
        width: fit-content;
        height: fit-content;
        border: 3px solid #1e293b;
        border-radius: 8px;
        margin: 0 auto 18px auto;
        overflow: hidden;
      }
      .sudoku-cell {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        width: 58px;
        height: 58px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.9rem;
        font-weight: 800;
        color: #2563eb;
        cursor: pointer;
        user-select: none;
        box-sizing: border-box;
      }
      .sudoku-cell.given {
        color: #0f172a;
        background: #f8fafc;
        cursor: not-allowed;
      }
      .sudoku-cell.selected {
        background: #e0f2fe;
        outline: 2px solid #0284c7;
        z-index: 2;
      }
      .sudoku-cell.thick-border-right {
        border-right: 3px solid #1e293b;
      }
      .sudoku-cell.thick-border-bottom {
        border-bottom: 3px solid #1e293b;
      }
      .sudoku-keypad {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-bottom: 16px;
      }
      .keypad-btn {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        border: 2px solid #cbd5e1;
        background: #ffffff;
        font-size: 1.6rem;
        font-weight: 700;
        cursor: pointer;
        color: #0f172a;
        transition: all 0.1s;
      }
      .keypad-btn:hover {
        border-color: #2563eb;
        background: #f8fafc;
      }
      .erase-btn {
        color: #dc2626;
      }

      .error-notice {
        margin-top: 16px;
        color: #b45309;
        font-weight: 600;
        font-size: 0.95rem;
      }

      .finished-card {
        background: #ffffff;
        border: 2px solid #bbf7d0;
        border-radius: 24px;
        padding: 48px;
        text-align: center;
        max-width: 550px;
        width: 100%;
      }
      .star-icon {
        font-size: 4rem;
        margin-bottom: 12px;
      }
      .finished-card h2 {
        font-size: 2rem;
        margin: 0 0 12px 0;
        color: #166534;
      }
      .restart-btn {
        background: #16a34a;
        color: #ffffff;
        border: none;
        padding: 14px 28px;
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 14px;
        cursor: pointer;
        margin-top: 16px;
      }
      .idle-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 500;
        animation: fadeIn 0.3s ease-out;
      }
      .idle-box {
        background: #ffffff;
        padding: 40px;
        border-radius: 24px;
        text-align: center;
        max-width: 440px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }
      .idle-icon {
        font-size: 3.5rem;
        margin-bottom: 12px;
      }
      .idle-box h2 {
        font-size: 1.6rem;
        margin: 0 0 10px 0;
        color: #0f172a;
      }
      .idle-box p {
        color: #64748b;
        font-size: 1.05rem;
        margin-bottom: 24px;
      }
      .continue-btn {
        background: #3b82f6;
        color: #ffffff;
        border: none;
        padding: 12px 28px;
        font-size: 1.1rem;
        font-weight: 700;
        border-radius: 12px;
        cursor: pointer;
      }
    `,
  ],
})
export class App implements OnInit, OnDestroy {
  public readonly timer = inject(FocusTimerService);
  private readonly storage = inject(StorageService);
  private readonly generator = inject(ExerciseGeneratorService);

  public readonly showDashboard = signal<boolean>(false);
  private windowKeydownListener = (e: KeyboardEvent) => this.handleGlobalKeydown(e);
  public readonly currentExerciseIndex = signal<number>(0);
  public readonly sessionFinished = signal<boolean>(false);

  // Contador de intentos por ejercicio
  public readonly currentAttempts = signal<number>(1);

  // Lista procedural de 10 ejercicios por tanda
  public readonly exercises = signal<Exercise[]>([]);

  // Estados socráticos
  public readonly socraticFeedback = signal<boolean>(false);
  public readonly seriesHintActive = signal<boolean>(false);

  // Mosaico 4x4 (16 celdas: 0 a 15)
  public readonly mosaicCells16 = Array.from({ length: 16 }, (_, i) => i);
  public readonly mosaicPhase = signal<'memorize' | 'recall'>('memorize');
  public readonly memorizeCountdown = signal<number>(5);
  public readonly selectedCells = signal<number[]>([]);
  public readonly isFlashingHint = signal<boolean>(false);
  private mosaicCountdownInterval: any = null;

  // Sudoku 4x4
  public readonly sudokuCurrentGrid = signal<(number | null)[]>([]);
  public readonly selectedSudokuCell = signal<number | null>(null);

  // Coordenadas
  public readonly cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  public readonly rows = [8, 7, 6, 5, 4, 3, 2, 1];
  public readonly highlightedCoordsAxis = signal<'col' | 'row' | null>(null);

  private sessionStartTime: string = '';
  private recordedResults: ExerciseResult[] = [];

  public currentExercise = computed(() => this.exercises()[this.currentExerciseIndex()]);
  public progressPercentage = computed(() => {
    const total = this.exercises().length;
    return total > 0 ? (this.currentExerciseIndex() / total) * 100 : 0;
  });

  ngOnInit(): void {
    window.addEventListener('keydown', this.windowKeydownListener);
    this.startSession();
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.windowKeydownListener);
    if (this.mosaicCountdownInterval) {
      clearInterval(this.mosaicCountdownInterval);
    }
  }

  private handleGlobalKeydown(e: KeyboardEvent): void {
    // Hotkey: Alt+P (o Ctrl+Shift+P) para abrir/cerrar el panel de papá
    if ((e.altKey && e.code === 'KeyP') || (e.ctrlKey && e.shiftKey && e.code === 'KeyP')) {
      e.preventDefault();
      this.showDashboard.update((v) => !v);
    }
  }

  startSession(): void {
    this.sessionStartTime = new Date().toISOString();
    this.recordedResults = [];
    const enabled = this.storage.enabledTypes();
    this.exercises.set(this.generator.generateSession(10, enabled));
    this.currentExerciseIndex.set(0);
    this.sessionFinished.set(false);
    this.initCurrentExercise();
  }

  private initCurrentExercise(): void {
    this.currentAttempts.set(1);
    this.socraticFeedback.set(false);
    this.seriesHintActive.set(false);
    this.highlightedCoordsAxis.set(null);
    this.selectedCells.set([]);
    this.isFlashingHint.set(false);
    this.selectedSudokuCell.set(null);

    const current = this.currentExercise();
    if (current && current.type === 'mosaic') {
      this.startMosaicMemorizePhase();
    } else if (current && current.type === 'sudoku') {
      this.sudokuCurrentGrid.set([...current.grid]);
      this.timer.start();
    } else {
      this.timer.start();
    }
  }

  // --- Mosaico 4x4 ---
  private startMosaicMemorizePhase(): void {
    this.mosaicPhase.set('memorize');
    this.memorizeCountdown.set(5);

    if (this.mosaicCountdownInterval) {
      clearInterval(this.mosaicCountdownInterval);
    }

    this.mosaicCountdownInterval = setInterval(() => {
      this.memorizeCountdown.update((v) => v - 1);
      if (this.memorizeCountdown() <= 0) {
        clearInterval(this.mosaicCountdownInterval);
        this.mosaicPhase.set('recall');
        this.timer.start();
      }
    }, 1000);
  }

  isTargetCell(cell: number): boolean {
    const current = this.currentExercise();
    return current.type === 'mosaic' && current.targetCells.includes(cell);
  }

  toggleMosaicCell(cell: number): void {
    if (this.mosaicPhase() !== 'recall') return;
    this.selectedCells.update((cells) =>
      cells.includes(cell) ? cells.filter((c) => c !== cell) : [...cells, cell]
    );
  }

  onMosaicSubmit(): void {
    const current = this.currentExercise() as MosaicExercise;
    const selected = [...this.selectedCells()].sort((a, b) => a - b);
    const target = current.targetCells;

    const isMatch =
      selected.length === target.length && selected.every((val, idx) => val === target[idx]);

    if (isMatch) {
      this.handleExerciseSuccess();
    } else {
      this.currentAttempts.update((a) => a + 1);
      this.socraticFeedback.set(true);
      this.isFlashingHint.set(true);
      setTimeout(() => this.isFlashingHint.set(false), 1000);
    }
  }

  // --- Sudoku 4x4 ---
  selectSudokuCell(idx: number): void {
    const current = this.asSudoku(this.currentExercise());
    if (current.initialGiven[idx]) return;
    this.selectedSudokuCell.set(idx);
  }

  inputSudokuNumber(num: number | null): void {
    const selected = this.selectedSudokuCell();
    if (selected === null) return;
    const updated = [...this.sudokuCurrentGrid()];
    updated[selected] = num;
    this.sudokuCurrentGrid.set(updated);
  }

  onSudokuSubmit(): void {
    const current = this.asSudoku(this.currentExercise());
    const currentGrid = this.sudokuCurrentGrid();
    const isCompleteAndCorrect = currentGrid.every(
      (val, idx) => val !== null && val === current.solution[idx]
    );

    if (isCompleteAndCorrect) {
      this.handleExerciseSuccess();
    } else {
      this.currentAttempts.update((a) => a + 1);
      this.socraticFeedback.set(true);
    }
  }

  // --- Cálculo ---
  onCalcAnswer(selected: number): void {
    const current = this.currentExercise() as CalcExercise;
    if (selected === current.correctAnswer) {
      this.handleExerciseSuccess();
    } else {
      this.currentAttempts.update((a) => a + 1);
      this.socraticFeedback.set(true);
      const wrongOptions = current.options.filter(
        (opt) => opt !== current.correctAnswer && opt !== current.discardedOption
      );
      if (wrongOptions.length > 0) {
        current.discardedOption = wrongOptions[0];
      }
    }
  }

  // --- Series ---
  onSeriesAnswer(selected: SeriesItem): void {
    const current = this.currentExercise() as SeriesExercise;
    const isCorrect =
      selected.shape === current.correctOption.shape &&
      selected.count === current.correctOption.count &&
      selected.color === current.correctOption.color;

    if (isCorrect) {
      this.handleExerciseSuccess();
    } else {
      this.currentAttempts.update((a) => a + 1);
      this.socraticFeedback.set(true);
      this.seriesHintActive.set(true);
    }
  }

  repeatShape(shape: string, count: number): string {
    return shape.repeat(count);
  }

  // --- Coordenadas ---
  colIndex(c: string): number {
    return this.cols.indexOf(c);
  }

  isCoordsAxisHighlighted(c: string, r: number): boolean {
    const axis = this.highlightedCoordsAxis();
    if (!axis) return false;
    const current = this.currentExercise() as CoordsExercise;
    return axis === 'col' ? c === current.column : r === current.row;
  }

  onCoordsClick(c: string, r: number): void {
    const current = this.currentExercise() as CoordsExercise;
    if (c === current.column && r === current.row) {
      this.handleExerciseSuccess();
    } else {
      this.currentAttempts.update((a) => a + 1);
      this.socraticFeedback.set(true);
      this.highlightedCoordsAxis.set(this.highlightedCoordsAxis() === 'col' ? 'row' : 'col');
    }
  }

  // --- Éxito y Progresión ---
  private handleExerciseSuccess(): void {
    const current = this.currentExercise();
    const elapsed = this.timer.stop();

    this.recordedResults.push({
      id: current.id,
      title: current.title,
      type: current.type,
      elapsedSeconds: elapsed,
      idlePausesCount: this.timer.idlePausesCount(),
      attemptsCount: this.currentAttempts(),
      completedAt: new Date().toISOString(),
      success: true,
    });

    if (this.currentExerciseIndex() + 1 < this.exercises().length) {
      this.currentExerciseIndex.update((i) => i + 1);
      this.initCurrentExercise();
    } else {
      this.completeSession();
    }
  }

  private completeSession(): void {
    this.sessionFinished.set(true);
    const totalFocus = this.recordedResults.reduce((acc, r) => acc + r.elapsedSeconds, 0);

    const record: SessionRecord = {
      id: `session-${Date.now()}`,
      startedAt: this.sessionStartTime,
      completedAt: new Date().toISOString(),
      totalExercises: this.exercises().length,
      totalFocusSeconds: totalFocus,
      exercises: this.recordedResults,
    };

    this.storage.saveSession(record);
  }

  restartSession(): void {
    this.startSession();
  }

  continueSessionWithFilter(): void {
    const enabled = this.storage.enabledTypes();
    const currentList = this.exercises();
    const currentIndex = this.currentExerciseIndex();

    // Conservar los ejercicios ya terminados (de 0 a currentIndex - 1)
    const completed = currentList.slice(0, currentIndex);

    // Regenerar los restantes para que se ajusten a los tipos seleccionados
    const remainingCount = currentList.length - currentIndex;
    const newRemaining = this.generator.generateSession(remainingCount, enabled);

    const updated = [...completed, ...newRemaining];
    this.exercises.set(updated);
    this.initCurrentExercise();
  }

  asCalc(e: Exercise): CalcExercise {
    return e as CalcExercise;
  }
  asSeries(e: Exercise): SeriesExercise {
    return e as SeriesExercise;
  }
  asCoords(e: Exercise): CoordsExercise {
    return e as CoordsExercise;
  }
  asSudoku(e: Exercise): SudokuExercise {
    return e as SudokuExercise;
  }
}
