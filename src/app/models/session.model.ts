export interface ExerciseResult {
  id: string;
  title: string;
  type: string;
  elapsedSeconds: number;
  idlePausesCount: number;
  attemptsCount: number; // Intentos fallidos + 1
  completedAt: string;
  success: boolean;
}

export interface SessionRecord {
  id: string;
  startedAt: string;
  completedAt: string;
  totalExercises: number;
  totalFocusSeconds: number;
  exercises: ExerciseResult[];
}
