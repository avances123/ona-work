export interface ExerciseResult {
  id: string;
  title: string;
  type: string;
  elapsedSeconds: number;
  idlePausesCount: number;
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
