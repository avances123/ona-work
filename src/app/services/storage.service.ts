import { Injectable, signal } from '@angular/core';
import { SessionRecord } from '../models/session.model';
import { ExerciseType } from '../models/exercise.model';
import { normalizeVocabWord } from '../data/vocab-definitions';

const STORAGE_KEY = 'ona_work_sessions_history';
const SETTINGS_KEY = 'ona_work_enabled_types';
const EXERCISE_COUNT_KEY = 'ona_work_exercise_count';
const VOCAB_KEY = 'ona_work_vocab_words';

const DEFAULT_TYPES: ExerciseType[] = ['calc', 'mosaic', 'sudoku', 'series', 'coords', 'crypto', 'reading', 'vocab'];
const DEFAULT_EXERCISE_COUNT = 10;

export interface VocabWordEntry {
  word: string;
  displayWord: string;
  definition?: string;
  distractors?: string[];
  streak: number;
  addedAt: string;
}

export interface OnaBackupData {
  version: number;
  exportedAt: string;
  sessions: SessionRecord[];
  enabledTypes: ExerciseType[];
  exerciseCount: number;
  vocabWords?: VocabWordEntry[];
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly sessionsSignal = signal<SessionRecord[]>(this.loadSessions());
  public readonly sessions = this.sessionsSignal.asReadonly();

  private readonly enabledTypesSignal = signal<ExerciseType[]>(this.loadEnabledTypes());
  public readonly enabledTypes = this.enabledTypesSignal.asReadonly();

  private readonly exerciseCountSignal = signal<number>(this.loadExerciseCount());
  public readonly exerciseCount = this.exerciseCountSignal.asReadonly();

  private readonly vocabWordsSignal = signal<VocabWordEntry[]>(this.loadVocabWords());
  public readonly vocabWords = this.vocabWordsSignal.asReadonly();

  private isStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private loadSessions(): SessionRecord[] {
    if (!this.isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error cargando historial de sesiones:', e);
      return [];
    }
  }

  private loadEnabledTypes(): ExerciseType[] {
    if (!this.isStorageAvailable()) return DEFAULT_TYPES;
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : DEFAULT_TYPES;
    } catch (e) {
      return DEFAULT_TYPES;
    }
  }

  private loadExerciseCount(): number {
    if (!this.isStorageAvailable()) return DEFAULT_EXERCISE_COUNT;
    try {
      const data = localStorage.getItem(EXERCISE_COUNT_KEY);
      if (data) {
        const val = parseInt(data, 10);
        return isNaN(val) || val <= 0 ? DEFAULT_EXERCISE_COUNT : val;
      }
      return DEFAULT_EXERCISE_COUNT;
    } catch (e) {
      return DEFAULT_EXERCISE_COUNT;
    }
  }

  saveExerciseCount(count: number): void {
    const val = count > 0 ? count : DEFAULT_EXERCISE_COUNT;
    this.exerciseCountSignal.set(val);
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(EXERCISE_COUNT_KEY, val.toString());
    } catch (e) {
      console.error('Error guardando número de ejercicios:', e);
    }
  }

  saveEnabledTypes(types: ExerciseType[]): void {
    const toSave = types.length > 0 ? types : DEFAULT_TYPES;
    this.enabledTypesSignal.set(toSave);
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Error guardando tipos de ejercicios:', e);
    }
  }

  saveSession(session: SessionRecord): void {
    const updated = [session, ...this.sessionsSignal()];
    this.sessionsSignal.set(updated);
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error guardando la sesión:', e);
    }
  }

  clearAll(): void {
    this.sessionsSignal.set([]);
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error limpiando sesiones:', e);
    }
  }

  exportData(): OnaBackupData {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      sessions: this.sessionsSignal(),
      enabledTypes: this.enabledTypesSignal(),
      exerciseCount: this.exerciseCountSignal(),
      vocabWords: this.vocabWordsSignal(),
    };
  }

  importData(raw: unknown): { ok: boolean; error?: string } {
    if (!raw || typeof raw !== 'object') {
      return { ok: false, error: 'El archivo no contiene un objeto JSON válido.' };
    }

    const data = raw as Partial<OnaBackupData>;
    if (!Array.isArray(data.sessions)) {
      return { ok: false, error: 'Falta la lista de sesiones en el respaldo.' };
    }

    const validTypes = Array.isArray(data.enabledTypes)
      ? data.enabledTypes.filter((t): t is ExerciseType => DEFAULT_TYPES.includes(t as ExerciseType))
      : [];
    const nextTypes = validTypes.length > 0 ? validTypes : DEFAULT_TYPES;

    const rawCount = typeof data.exerciseCount === 'number' ? Math.floor(data.exerciseCount) : DEFAULT_EXERCISE_COUNT;
    const nextCount = rawCount > 0 && rawCount <= 50 ? rawCount : DEFAULT_EXERCISE_COUNT;

    const nextVocab = Array.isArray(data.vocabWords)
      ? data.vocabWords.filter((v): v is VocabWordEntry => !!v && typeof v.word === 'string' && v.word.length > 0)
      : this.vocabWordsSignal();

    this.sessionsSignal.set(data.sessions);
    this.enabledTypesSignal.set(nextTypes);
    this.exerciseCountSignal.set(nextCount);
    this.vocabWordsSignal.set(nextVocab);

    if (this.isStorageAvailable()) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.sessions));
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextTypes));
        localStorage.setItem(EXERCISE_COUNT_KEY, nextCount.toString());
        localStorage.setItem(VOCAB_KEY, JSON.stringify(nextVocab));
      } catch (e) {
        console.error('Error guardando datos importados:', e);
        return { ok: false, error: 'No se pudo guardar en localStorage.' };
      }
    }

    return { ok: true };
  }

  private loadVocabWords(): VocabWordEntry[] {
    if (!this.isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(VOCAB_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private persistVocabWords(words: VocabWordEntry[]): void {
    this.vocabWordsSignal.set(words);
    if (!this.isStorageAvailable()) return;
    try {
      localStorage.setItem(VOCAB_KEY, JSON.stringify(words));
    } catch (e) {
      console.error('Error guardando vocabulario:', e);
    }
  }

  addVocabWord(rawWord: string, customDefinition?: string): { added: boolean; word: string } {
    const normalized = normalizeVocabWord(rawWord);
    if (!normalized) return { added: false, word: '' };

    const existing = this.vocabWordsSignal();
    if (existing.some((w) => w.word === normalized)) {
      return { added: false, word: normalized };
    }

    const entry: VocabWordEntry = {
      word: normalized,
      displayWord: normalized,
      definition: customDefinition?.trim() || undefined,
      streak: 0,
      addedAt: new Date().toISOString(),
    };

    this.persistVocabWords([...existing, entry]);
    return { added: true, word: normalized };
  }

  recordVocabAttempt(word: string, firstTrySuccess: boolean): { learned: boolean; newStreak: number } {
    const normalized = normalizeVocabWord(word);
    const current = this.vocabWordsSignal();
    const target = current.find((w) => w.word === normalized);
    if (!target) return { learned: false, newStreak: 0 };

    const newStreak = firstTrySuccess ? target.streak + 1 : 0;
    if (newStreak >= 3) {
      this.persistVocabWords(current.filter((w) => w.word !== normalized));
      return { learned: true, newStreak };
    }

    this.persistVocabWords(
      current.map((w) => (w.word === normalized ? { ...w, streak: newStreak } : w))
    );
    return { learned: false, newStreak };
  }

  updateVocabDefinition(word: string, definition: string): void {
    const normalized = normalizeVocabWord(word);
    const trimmed = definition.trim();
    this.persistVocabWords(
      this.vocabWordsSignal().map((w) =>
        w.word === normalized ? { ...w, definition: trimmed || undefined } : w
      )
    );
  }

  setVocabDefinitions(word: string, definition: string, distractors?: string[]): void {
    const normalized = normalizeVocabWord(word);
    const trimmed = definition.trim();
    if (!trimmed) return;
    const cleanDistractors = distractors?.map((d) => d.trim()).filter((d) => d.length > 0 && d !== trimmed);

    this.persistVocabWords(
      this.vocabWordsSignal().map((w) =>
        w.word === normalized
          ? {
              ...w,
              definition: trimmed,
              distractors: cleanDistractors && cleanDistractors.length >= 2 ? cleanDistractors.slice(0, 2) : w.distractors,
            }
          : w
      )
    );
  }

  removeVocabWord(word: string): void {
    const normalized = normalizeVocabWord(word);
    this.persistVocabWords(this.vocabWordsSignal().filter((w) => w.word !== normalized));
  }
}

