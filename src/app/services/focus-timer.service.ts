import { Injectable, signal, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FocusTimerService implements OnDestroy {
  private timerInterval: any = null;
  private idleCheckInterval: any = null;

  // Segundos de foco en el ejercicio actual
  public readonly elapsedSeconds = signal<number>(0);

  // Estado de inactividad
  public readonly isIdle = signal<boolean>(false);
  public readonly idlePausesCount = signal<number>(0);

  // Umbral de inactividad: 60 segundos
  private readonly IDLE_THRESHOLD_SECONDS = 60;
  private secondsSinceLastActivity = 0;
  private isRunning = false;

  private userActivityListener = () => this.recordUserActivity();

  constructor() {
    this.attachActivityListeners();
  }

  start(): void {
    this.elapsedSeconds.set(0);
    this.idlePausesCount.set(0);
    this.isIdle.set(false);
    this.secondsSinceLastActivity = 0;
    this.isRunning = true;

    this.startIntervals();
  }

  resumeFromIdle(): void {
    if (this.isIdle()) {
      this.isIdle.set(false);
      this.secondsSinceLastActivity = 0;
    }
  }

  stop(): number {
    this.isRunning = false;
    this.clearIntervals();
    return this.elapsedSeconds();
  }

  private startIntervals(): void {
    this.clearIntervals();

    // Cronómetro de foco cada 1 segundo (solo si no está en pausa por inactividad)
    this.timerInterval = setInterval(() => {
      if (this.isRunning && !this.isIdle()) {
        this.elapsedSeconds.update((s) => s + 1);
      }
    }, 1000);

    // Comprobador de inactividad cada 1 segundo
    this.idleCheckInterval = setInterval(() => {
      if (this.isRunning && !this.isIdle()) {
        this.secondsSinceLastActivity++;
        if (this.secondsSinceLastActivity >= this.IDLE_THRESHOLD_SECONDS) {
          this.isIdle.set(true);
          this.idlePausesCount.update((count) => count + 1);
        }
      }
    }, 1000);
  }

  private clearIntervals(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
  }

  private recordUserActivity(): void {
    this.secondsSinceLastActivity = 0;
    if (this.isIdle()) {
      this.resumeFromIdle();
    }
  }

  private attachActivityListeners(): void {
    window.addEventListener('mousemove', this.userActivityListener, { passive: true });
    window.addEventListener('keydown', this.userActivityListener, { passive: true });
    window.addEventListener('touchstart', this.userActivityListener, { passive: true });
    window.addEventListener('mousedown', this.userActivityListener, { passive: true });
  }

  private detachActivityListeners(): void {
    window.removeEventListener('mousemove', this.userActivityListener);
    window.removeEventListener('keydown', this.userActivityListener);
    window.removeEventListener('touchstart', this.userActivityListener);
    window.removeEventListener('mousedown', this.userActivityListener);
  }

  ngOnDestroy(): void {
    this.clearIntervals();
    this.detachActivityListeners();
  }
}
