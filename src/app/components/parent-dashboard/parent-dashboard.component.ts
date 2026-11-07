import { Component, computed, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage.service';
import { ExerciseType } from '../../models/exercise.model';

@Component({
  selector: 'app-parent-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-backdrop" (click)="close()">
      <div class="dashboard-modal" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h2>📊 Panel de Supervisión (Papá)</h2>
          <button class="close-btn" (click)="close()">✕</button>
        </header>

        <section class="metrics-summary">
          <div class="stat-card">
            <span class="label">Total Sesiones</span>
            <span class="value">{{ totalSessions() }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Minutos de Foco Acumulados</span>
            <span class="value">{{ totalFocusMinutes() }} min</span>
          </div>
        </section>

        <!-- Configuración de tipos de ejercicios para las sesiones -->
        <section class="exercise-types-config">
          <h3>Tipos de Ejercicios en Sesiones</h3>
          <p class="config-desc">Selecciona los bloques que quieres que se generen en las tandas:</p>
          <div class="types-grid">
            <label *ngFor="let t of availableExerciseTypes" class="type-checkbox-label">
              <input
                type="checkbox"
                [checked]="isTypeEnabled(t.id)"
                (change)="toggleType(t.id)"
              />
              <span class="type-name">{{ t.label }}</span>
            </label>
          </div>
        </section>

        <section class="sessions-list">
          <h3>Historial de Sesiones</h3>
          <div *ngIf="sessions().length === 0" class="empty-msg">
            No hay sesiones registradas todavía.
          </div>

          <div *ngFor="let s of sessions()" class="session-item">
            <div class="session-main">
              <strong>{{ s.startedAt | date : 'dd/MM/yyyy HH:mm' }}</strong>
              <span>{{ s.totalExercises }} ejercicios</span>
              <span class="badge">{{ formatMinutes(s.totalFocusSeconds) }}</span>
            </div>

            <details class="exercise-details">
              <summary>Ver detalle de ejercicios</summary>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ejercicio</th>
                    <th>Tiempo Foco</th>
                    <th>Fallos / Intentos</th>
                    <th>Pausas Inactividad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let ex of s.exercises; let i = index">
                    <td>{{ i + 1 }}</td>
                    <td>{{ ex.title }}</td>
                    <td>{{ ex.elapsedSeconds }}s</td>
                    <td>
                      <span [style.color]="(ex.attemptsCount || 1) > 1 ? '#dc2626' : '#16a34a'" [style.fontWeight]="'700'">
                        {{ (ex.attemptsCount || 1) - 1 }} fallos ({{ ex.attemptsCount || 1 }} intentos)
                      </span>
                    </td>
                    <td>{{ ex.idlePausesCount }}</td>
                  </tr>
                </tbody>
              </table>
            </details>
          </div>
        </section>

        <footer class="modal-footer">
          <button class="clear-btn" (click)="clearAll()">Borrar Historial</button>
        </footer>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
      }
      .dashboard-modal {
        background: #ffffff;
        width: 100%;
        max-width: 720px;
        max-height: 85vh;
        border-radius: 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        color: #1e293b;
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
      }
      .modal-header h2 {
        margin: 0;
        font-size: 1.25rem;
      }
      .close-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 4px 8px;
        color: #64748b;
      }
      .metrics-summary {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        padding: 20px 24px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .exercise-types-config {
        padding: 16px 24px;
        background: #f1f5f9;
        border-bottom: 1px solid #e2e8f0;
      }
      .exercise-types-config h3 {
        margin: 0 0 4px 0;
        font-size: 0.95rem;
        color: #0f172a;
      }
      .config-desc {
        margin: 0 0 10px 0;
        font-size: 0.85rem;
        color: #64748b;
      }
      .types-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;
      }
      .type-checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ffffff;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 600;
        color: #334155;
      }
      .type-checkbox-label input {
        cursor: pointer;
        width: 16px;
        height: 16px;
      }
      .stat-card {
        background: #ffffff;
        padding: 14px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
      }
      .stat-card .label {
        font-size: 0.8rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 600;
      }
      .stat-card .value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 4px;
      }
      .sessions-list {
        flex: 1;
        overflow-y: auto;
        padding: 20px 24px;
      }
      .sessions-list h3 {
        margin-top: 0;
        font-size: 1rem;
        color: #334155;
      }
      .empty-msg {
        color: #94a3b8;
        font-style: italic;
        padding: 20px 0;
        text-align: center;
      }
      .session-item {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        margin-bottom: 12px;
        padding: 12px 16px;
      }
      .session-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .badge {
        background: #e0f2fe;
        color: #0369a1;
        padding: 4px 10px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .exercise-details {
        margin-top: 10px;
        font-size: 0.9rem;
      }
      .exercise-details summary {
        cursor: pointer;
        color: #2563eb;
        font-weight: 500;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th,
      td {
        text-align: left;
        padding: 6px 8px;
        border-bottom: 1px solid #f1f5f9;
      }
      th {
        color: #64748b;
        font-size: 0.8rem;
      }
      .modal-footer {
        padding: 14px 24px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
      }
      .clear-btn {
        background: #fee2e2;
        color: #991b1b;
        border: none;
        padding: 8px 14px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
    `,
  ],
})
export class ParentDashboardComponent {
  private readonly storage = inject(StorageService);
  public readonly sessions = this.storage.sessions;
  public readonly enabledTypes = this.storage.enabledTypes;

  public readonly availableExerciseTypes: { id: ExerciseType; label: string }[] = [
    { id: 'calc', label: 'Cálculo' },
    { id: 'mosaic', label: 'Mosaicos 4×4' },
    { id: 'sudoku', label: 'Sudokus 4×4' },
    { id: 'series', label: 'Series Visuales' },
    { id: 'coords', label: 'Coordenadas' },
  ];

  public totalSessions = computed(() => this.sessions().length);
  public totalFocusMinutes = computed(() => {
    const totalSecs = this.sessions().reduce((acc, s) => acc + s.totalFocusSeconds, 0);
    return Math.round(totalSecs / 60);
  });

  public readonly closed = output<void>();

  isTypeEnabled(type: ExerciseType): boolean {
    return this.enabledTypes().includes(type);
  }

  toggleType(type: ExerciseType): void {
    const current = this.enabledTypes();
    let updated: ExerciseType[];
    if (current.includes(type)) {
      if (current.length === 1) {
        alert('Debe haber al menos un tipo de ejercicio seleccionado.');
        return;
      }
      updated = current.filter((t) => t !== type);
    } else {
      updated = [...current, type];
    }
    this.storage.saveEnabledTypes(updated);
  }

  formatMinutes(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  clearAll(): void {
    if (confirm('¿Seguro que quieres borrar todo el historial local de sesiones?')) {
      this.storage.clearAll();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
