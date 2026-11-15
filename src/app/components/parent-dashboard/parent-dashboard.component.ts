import { Component, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../services/storage.service';
import { VocabAiService } from '../../services/vocab-ai.service';
import { ExerciseType } from '../../models/exercise.model';
import { findVocabDefinition, normalizeVocabWord } from '../../data/vocab-definitions';

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
          <div class="count-config-row">
            <label for="exerciseCount" class="count-label">Número de ejercicios por sesión:</label>
            <input
              id="exerciseCount"
              type="number"
              min="1"
              max="50"
              class="exercise-count-input"
              [value]="exerciseCount()"
              (change)="onCountChange($event)"
            />
          </div>

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

        <section class="vocab-config">
          <h3>Vocabulario en Práctica ({{ vocabWords().length }})</h3>
          <div class="vocab-add-row">
            <input
              type="text"
              class="vocab-add-input"
              placeholder="Añadir palabra (ej. rasguño)..."
              [value]="newVocabWord()"
              (input)="newVocabWord.set($any($event.target).value)"
              (keydown.enter)="addManualVocab()"
              [disabled]="addingVocab()"
            />
            <button
              type="button"
              class="vocab-add-manual-btn"
              [disabled]="addingVocab() || !newVocabWord().trim()"
              (click)="addManualVocab()"
            >
              {{ addingVocab() ? 'Buscando...' : '+ Añadir' }}
            </button>
          </div>
          <div *ngIf="vocabWords().length === 0" class="empty-msg">
            No hay palabras pendientes. El ejercicio de Vocabulario no aparecerá hasta que añadas una palabra o Ona la seleccione en un relato.
          </div>
          <div *ngFor="let w of vocabWords()" class="vocab-item">
            <div class="vocab-item-top">
              <strong>{{ w.displayWord }}</strong>
              <span class="vocab-streak-badge">Racha: {{ w.streak }}/3</span>
              <button
                *ngIf="!getVocabDefPreview(w.word, w.definition)"
                class="vocab-ai-btn"
                [disabled]="loadingVocabWord() === w.word"
                (click)="retryVocabAi(w.word)"
              >
                {{ loadingVocabWord() === w.word ? 'Buscando...' : '✨ Generar IA' }}
              </button>
              <button class="vocab-del-btn" (click)="removeVocab(w.word)" title="Eliminar palabra">✕</button>
            </div>
            <div class="vocab-def-preview" *ngIf="getVocabDefPreview(w.word, w.definition) as def; else missingDef">
              {{ def }}
            </div>
            <ng-template #missingDef>
              <div class="vocab-def-missing">Pendiente de definición (pulsa ✨ Generar IA)</div>
            </ng-template>
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

        <div *ngIf="transferMessage() as msg" class="transfer-status" [class.is-error]="msg.isError">
          {{ msg.text }}
        </div>

        <footer class="modal-footer">
          <div class="session-actions">
            <button class="action-btn continue-session-btn" (click)="continueSession()">Continuar Sesión</button>
            <button class="action-btn restart-session-btn" (click)="restartSession()">Reiniciar Sesión</button>
          </div>
          <div class="data-actions">
            <button class="secondary-btn export-btn" (click)="exportBackup()">Exportar datos</button>
            <label class="secondary-btn import-btn">
              Importar datos
              <input
                type="file"
                accept="application/json,.json"
                class="import-file-input"
                hidden
                (change)="onImportFile($event)"
              />
            </label>
            <button class="clear-btn" (click)="clearAll()">Borrar Historial</button>
          </div>
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
      .count-config-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        background: #ffffff;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #cbd5e1;
      }
      .count-label {
        font-weight: 700;
        font-size: 0.95rem;
        color: #1e293b;
      }
      .exercise-count-input {
        width: 70px;
        padding: 6px 10px;
        font-size: 1.1rem;
        font-weight: 800;
        text-align: center;
        border: 2px solid #94a3b8;
        border-radius: 6px;
        color: #0f172a;
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
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .session-actions,
      .data-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .secondary-btn {
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #cbd5e1;
        padding: 8px 12px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
      }
      .secondary-btn:hover {
        background: #e2e8f0;
      }
      .transfer-status {
        padding: 8px 24px;
        font-size: 0.85rem;
        font-weight: 600;
        color: #166534;
        background: #dcfce7;
        border-top: 1px solid #bbf7d0;
      }
      .transfer-status.is-error {
        color: #991b1b;
        background: #fee2e2;
        border-top-color: #fecaca;
      }
      .action-btn {
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.15s;
      }
      .continue-session-btn {
        background: #0284c7;
        color: #ffffff;
      }
      .continue-session-btn:hover {
        background: #0369a1;
      }
      .restart-session-btn {
        background: #16a34a;
        color: #ffffff;
      }
      .restart-session-btn:hover {
        background: #15803d;
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
      .vocab-config {
        padding: 12px 24px;
        border-bottom: 1px solid #e2e8f0;
        max-height: 180px;
        overflow-y: auto;
      }
      .vocab-config h3 {
        margin: 0 0 8px 0;
        font-size: 0.95rem;
      }
      .vocab-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        margin-bottom: 6px;
        background: #f8fafc;
      }
      .vocab-item-top {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .vocab-streak-badge {
        font-size: 0.78rem;
        font-weight: 700;
        color: #0369a1;
        background: #e0f2fe;
        padding: 2px 8px;
        border-radius: 999px;
      }
      .vocab-del-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-weight: 700;
      }
      .vocab-del-btn:hover {
        color: #dc2626;
      }
      .vocab-def-preview {
        font-size: 0.85rem;
        color: #334155;
      }
      .vocab-def-missing {
        font-size: 0.82rem;
        color: #b45309;
      }
      .vocab-ai-btn {
        background: #ede9fe;
        color: #5b21b6;
        border: 1px solid #c4b5fd;
        border-radius: 6px;
        padding: 2px 8px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
      }
      .vocab-add-row {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
      }
      .vocab-add-input {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-size: 0.9rem;
      }
      .vocab-add-manual-btn {
        background: #2563eb;
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 6px 14px;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
      }
      .vocab-add-manual-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class ParentDashboardComponent {
  private readonly storage = inject(StorageService);
  private readonly vocabAi = inject(VocabAiService);
  public readonly loadingVocabWord = signal<string | null>(null);
  public readonly newVocabWord = signal<string>('');
  public readonly addingVocab = signal<boolean>(false);
  public readonly sessions = this.storage.sessions;
  public readonly enabledTypes = this.storage.enabledTypes;
  public readonly exerciseCount = this.storage.exerciseCount;
  public readonly vocabWords = this.storage.vocabWords;

  public readonly availableExerciseTypes: { id: ExerciseType; label: string }[] = [
    { id: 'calc', label: 'Cálculo' },
    { id: 'mosaic', label: 'Mosaicos 4×4' },
    { id: 'sudoku', label: 'Sudokus 4×4' },
    { id: 'series', label: 'Series Visuales' },
    { id: 'coords', label: 'Coordenadas' },
    { id: 'crypto', label: 'Criptogramas' },
    { id: 'reading', label: 'Lectura (Detectives)' },
    { id: 'vocab', label: 'Vocabulario' },
  ];

  public totalSessions = computed(() => this.sessions().length);
  public totalFocusMinutes = computed(() => {
    const totalSecs = this.sessions().reduce((acc, s) => acc + s.totalFocusSeconds, 0);
    return Math.round(totalSecs / 60);
  });

  public readonly closed = output<void>();
  public readonly restartRequested = output<void>();
  public readonly continueRequested = output<void>();
  public readonly transferMessage = signal<{ text: string; isError: boolean } | null>(null);

  onCountChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    if (!isNaN(val) && val > 0) {
      this.storage.saveExerciseCount(val);
    }
  }

  continueSession(): void {
    this.continueRequested.emit();
    this.closed.emit();
  }

  restartSession(): void {
    this.restartRequested.emit();
    this.closed.emit();
  }

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

  getVocabDefPreview(word: string, customDef?: string): string {
    return findVocabDefinition(word, customDef) ?? '';
  }

  onVocabDefChange(word: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.storage.updateVocabDefinition(word, input.value);
  }

  async addManualVocab(): Promise<void> {
    const cleaned = normalizeVocabWord(this.newVocabWord());
    if (!cleaned || cleaned.length < 2 || !/^[a-záéíóúüñ]+$/i.test(cleaned)) {
      this.transferMessage.set({
        text: 'Introduce una única palabra válida (solo letras).',
        isError: true,
      });
      return;
    }

    const { added } = this.storage.addVocabWord(cleaned);
    this.newVocabWord.set('');

    const existing = this.vocabWords().find((w) => w.word === cleaned);
    if (!added && existing?.definition) {
      this.transferMessage.set({
        text: `La palabra "${cleaned}" ya está en la lista.`,
        isError: false,
      });
      return;
    }

    this.addingVocab.set(true);
    const res = await this.vocabAi.fetchDefinitions(cleaned);
    if (res) {
      this.storage.setVocabDefinitions(cleaned, res.correct, res.distractors);
      this.transferMessage.set({
        text: `Palabra "${cleaned}" añadida con definición.`,
        isError: false,
      });
    } else {
      this.transferMessage.set({
        text: `Palabra "${cleaned}" añadida (si falta definición, pulsa ✨ Generar IA).`,
        isError: false,
      });
    }
    this.addingVocab.set(false);
  }

  async retryVocabAi(word: string): Promise<void> {
    this.loadingVocabWord.set(word);
    const res = await this.vocabAi.fetchDefinitions(word);
    if (res) {
      this.storage.setVocabDefinitions(word, res.correct, res.distractors);
    }
    this.loadingVocabWord.set(null);
  }

  removeVocab(word: string): void {
    this.storage.removeVocabWord(word);
  }

  clearAll(): void {
    if (confirm('¿Seguro que quieres borrar todo el historial local de sesiones?')) {
      this.storage.clearAll();
      this.transferMessage.set(null);
    }
  }

  exportBackup(): void {
    const data = this.storage.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateTag = new Date().toISOString().slice(0, 10);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ona-work-backup-${dateTag}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    this.transferMessage.set({
      text: `Datos exportados (${data.sessions.length} sesiones).`,
      isError: false,
    });
  }

  async onImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const result = this.storage.importData(parsed);

      if (result.ok) {
        this.transferMessage.set({
          text: `Datos importados (${this.sessions().length} sesiones).`,
          isError: false,
        });
      } else {
        this.transferMessage.set({
          text: result.error ?? 'Formato de respaldo no válido.',
          isError: true,
        });
      }
    } catch {
      this.transferMessage.set({
        text: 'No se pudo leer el archivo JSON.',
        isError: true,
      });
    } finally {
      input.value = '';
    }
  }

  close(): void {
    this.closed.emit();
  }
}
