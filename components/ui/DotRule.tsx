import Cell from './Cell';

/** Decorative divider: a row of cells climbing from one dot to six. */
export default function DotRule() {
  const steps = [[1], [1, 2], [1, 2, 3], [1, 2, 3, 4], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]];
  return (
    <div className="dot-rule" aria-hidden="true">
      {steps.map((dots, i) => (
        <Cell key={i} dots={dots} size="xs" flat="quiet" />
      ))}
    </div>
  );
}
