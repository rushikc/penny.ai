export type ProgressTone = 'primary' | 'warning' | 'danger';

/** Color band used by Budget cards and ProgressTrack fill. */
export const getProgressTone = (percentage: number): ProgressTone => {
  if (percentage >= 100) return 'danger';
  if (percentage >= 85) return 'warning';
  return 'primary';
};

export const clampProgressPercent = (percentage: number): number =>
  Math.max(0, Math.min(100, percentage));
