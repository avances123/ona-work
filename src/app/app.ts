import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusTimerService } from './services/focus-timer.service';
import { StorageService } from './services/storage.service';
import { ExerciseResult, SessionRecord } from './models/session.model';
import { ParentDashboardComponent } from './components/parent-dashboard/parent-dashboard.component';

interface ExerciseDef {
  id: string;
  title: string;
  prompt: string;
  targetAnswer: number;
  options: number[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ParentDashboardComponent],
  template: `
    <main class="app-container">
      <!-- Barra superior discreta: progreso N ejercicios y acceso papá -->
      <header class="top-bar">
        <div class="progress-info">
          <span class="exercise-indicator">
            Ejercicio {{ currentExerciseIndex() + 1 }} de {{ exercises.length }}
          </span>
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
          </div>
        </div>

        <button
          class="secret-dashboard-btn"
          title="Vista Papá (Control)"
          (click)="showDashboard.set(true)"
        >
          ⚙️
        </button>
      </header>

      <!-- Zona de trabajo principal -->
      <section class="workspace">
        <div *ngIf="!sessionFinished(); else finishedTemplate" class="exercise-card">
          <h1 class="exercise-prompt">{{ currentExercise().prompt }}</h1>

          <div class="options-grid">
            <button
              *ngFor="let opt of currentExercise().options"
              class="option-btn"
              (click)="selectOption(opt)"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <ng-template #finishedTemplate>
          <div class="finished-card">
            <div class="star-icon">⭐</div>
            <h2>¡Sesión completada, Ona!</h2>
            <p>Has completado todos los ejercicios con mucha concentración.</p>
            <button class="restart-btn" (click)="restartSession()">Hacer otra tanda</button>
          </div>
        </ng-template>
      </section>

      <!-- Overlay suave de pausa por inactividad (60 segundos) -->
      <div *ngIf="timer.isIdle()" class="idle-overlay" (click)="timer.resumeFromIdle()">
        <div class="idle-box">
          <div class="idle-icon">🌱</div>
          <h2>¡Ánimo, seguimos concentradas!</h2>
          <p>Toca la pantalla o mueve el ratón para continuar.</p>
          <button class="continue-btn" (click)="timer.resumeFromIdle()">Continuar</button>
        </div>
      </div>

      <!-- Modal de supervisión para Papá -->
      <app-parent-dashboard
        *ngIf="showDashboard()"
        (closed)="showDashboard.set(false)"
      ></app-parent-dashboard>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100vw;
        height: 100vh;
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
      .timer-display {
        font-size: 1.1rem;
        font-weight: 700;
        color: #64748b;
        background: #f1f5f9;
        padding: 6px 14px;
        border-radius: 20px;
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
        padding: 30px;
      }
      .exercise-card {
        background: #ffffff;
        border: 2px solid #e2e8f0;
        border-radius: 24px;
        padding: 48px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        max-width: 650px;
        width: 100%;
        text-align: center;
      }
      .exercise-prompt {
        font-size: 3rem;
        margin-top: 0;
        margin-bottom: 40px;
        color: #1e293b;
        letter-spacing: -0.02em;
      }
      .options-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }
      .option-btn {
        background: #f8fafc;
        border: 2px solid #cbd5e1;
        border-radius: 18px;
        padding: 24px;
        font-size: 2.5rem;
        font-weight: 800;
        color: #0f172a;
        cursor: pointer;
        transition: all 0.15s ease-in-out;
      }
      .option-btn:hover {
        background: #f1f5f9;
        border-color: #3b82f6;
        transform: translateY(-2px);
      }
      .option-btn:active {
        transform: translateY(0);
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
      .session-summary-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        padding: 16px;
        margin: 24px 0;
        font-size: 1.1rem;
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
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `,
  ],
})
export class App implements OnInit {
  public readonly timer = inject(FocusTimerService);
  private readonly storage = inject(StorageService);

  public readonly showDashboard = signal<boolean>(false);
  public readonly currentExerciseIndex = signal<number>(0);
  public readonly sessionFinished = signal<boolean>(false);

  // Lista de ejercicios de la tanda actual (ejemplo aritmético acorde a 1.º EGB: tablas 1 a 4)
  public readonly exercises: ExerciseDef[] = [
    { id: 'ex-1', title: 'Multiplicación 4 x 2', prompt: '4 × 2 = ?', targetAnswer: 8, options: [6, 8, 12] },
    { id: 'ex-2', title: 'Multiplicación 3 x 3', prompt: '3 × 3 = ?', targetAnswer: 9, options: [9, 6, 12] },
    { id: 'ex-3', title: 'Multiplicación 4 x 4', prompt: '4 × 4 = ?', targetAnswer: 16, options: [14, 16, 18] },
    { id: 'ex-4', title: 'Multiplicación 2 x 4', prompt: '2 × 4 = ?', targetAnswer: 8, options: [7, 8, 10] },
    { id: 'ex-5', title: 'Multiplicación 3 x 4', prompt: '3 × 4 = ?', targetAnswer: 12, options: [10, 11, 12] },
  ];

  private sessionStartTime: string = '';
  private recordedResults: ExerciseResult[] = [];

  public currentExercise = computed(() => this.exercises[this.currentExerciseIndex()]);
  public progressPercentage = computed(
    () => (this.currentExerciseIndex() / this.exercises.length) * 100
  );

  ngOnInit(): void {
    this.startSession();
  }

  startSession(): void {
    this.sessionStartTime = new Date().toISOString();
    this.recordedResults = [];
    this.currentExerciseIndex.set(0);
    this.sessionFinished.set(false);
    this.timer.start();
  }

  selectOption(selected: number): void {
    if (this.sessionFinished()) return;

    const current = this.currentExercise();
    const isCorrect = selected === current.targetAnswer;

    if (!isCorrect) {
      // Si falla, no avanza: fomenta corregir y concentrarse
      return;
    }

    const elapsed = this.timer.stop();
    this.recordedResults.push({
      id: current.id,
      title: current.title,
      type: 'math',
      elapsedSeconds: elapsed,
      idlePausesCount: this.timer.idlePausesCount(),
      completedAt: new Date().toISOString(),
      success: true,
    });

    if (this.currentExerciseIndex() + 1 < this.exercises.length) {
      this.currentExerciseIndex.update((i) => i + 1);
      this.timer.start();
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
      totalExercises: this.exercises.length,
      totalFocusSeconds: totalFocus,
      exercises: this.recordedResults,
    };

    this.storage.saveSession(record);
  }

  formatTotalTime(): string {
    const total = this.recordedResults.reduce((acc, r) => acc + r.elapsedSeconds, 0);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return mins > 0 ? `${mins} min ${secs} s` : `${secs} segundos`;
  }

  restartSession(): void {
    this.startSession();
  }

  handleDashboardClose(event: MouseEvent): void {
    this.showDashboard.set(false);
  }
}
