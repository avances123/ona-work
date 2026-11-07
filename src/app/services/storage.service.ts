import { Injectable, signal } from '@angular/core';
import { SessionRecord } from '../models/session.model';
import { ExerciseType } from '../models/exercise.model';

const STORAGE_KEY = 'ona_work_sessions_history';
const SETTINGS_KEY = 'ona_work_enabled_types';

const DEFAULT_TYPES: ExerciseType[] = ['calc', 'mosaic', 'sudoku', 'series', 'coords'];

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly sessionsSignal = signal<SessionRecord[]>(this.loadSessions());
  public readonly sessions = this.sessionsSignal.asReadonly();

  private readonly enabledTypesSignal = signal<ExerciseType[]>(this.loadEnabledTypes());
  public readonly enabledTypes = this.enabledTypesSignal.asReadonly();

  private loadSessions(): SessionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error cargando historial de sesiones:', e);
      return [];
    }
  }

  private loadEnabledTypes(): ExerciseType[] {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : DEFAULT_TYPES;
    } catch (e) {
      return DEFAULT_TYPES;
    }
  }

  saveEnabledTypes(types: ExerciseType[]): void {
    const toSave = types.length > 0 ? types : DEFAULT_TYPES;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
      this.enabledTypesSignal.set(toSave);
    } catch (e) {
      console.error('Error guardando tipos de ejercicios:', e);
    }
  }

  saveSession(session: SessionRecord): void {
    const updated = [session, ...this.sessionsSignal()];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      this.sessionsSignal.set(updated);
    } catch (e) {
      console.error('Error guardando la sesión:', e);
    }
  }

  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.sessionsSignal.set([]);
    } catch (e) {
      console.error('Error limpiando sesiones:', e);
    }
  }
}

