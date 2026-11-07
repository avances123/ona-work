import { Injectable, signal } from '@angular/core';
import { SessionRecord } from '../models/session.model';

const STORAGE_KEY = 'ona_work_sessions_history';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly sessionsSignal = signal<SessionRecord[]>(this.loadSessions());
  public readonly sessions = this.sessionsSignal.asReadonly();

  private loadSessions(): SessionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error cargando historial de sesiones:', e);
      return [];
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
