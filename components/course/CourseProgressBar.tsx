/**
 * Presentational course progress bar. Accessible via role="progressbar".
 * Purely visual state driven by props — safe to use in client trees.
 */
interface CourseProgressBarProps {
  percent: number;
  completedCount: number;
  total: number;
  /** Hide the "X of Y lessons" caption (e.g. compact in-lesson use). */
  compact?: boolean;
}

export default function CourseProgressBar({ percent, completedCount, total, compact }: CourseProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="course-progress">
      <div
        className="course-progress-track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Course progress: ${completedCount} of ${total} lessons complete`}
      >
        <div className="course-progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      {!compact && (
        <p className="course-progress-caption">
          {completedCount} of {total} lessons complete{clamped === 100 ? ' — course finished! 🎉' : ''}
        </p>
      )}
    </div>
  );
}
