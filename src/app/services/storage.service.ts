import { Injectable, signal } from '@angular/core';
import { SessionRecord } from '../models/session.model';
import { ExerciseType } from '../models/exercise.model';

const STORAGE_KEY = 'ona_work_sessions_history';
const SETTINGS_KEY = 'ona_work_enabled_types';
const EXERCISE_COUNT_KEY = 'ona_work_exercise_count';

const DEFAULT_TYPES: ExerciseType[] = ['calc', 'mosaic', 'sudoku', 'series', 'coords', 'crypto'];
const DEFAULT_EXERCISE_COUNT = 10;

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
}

