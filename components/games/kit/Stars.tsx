import Cell from '@/components/ui/Cell';

/** 0–3 stars, drawn as cells filling up (1, 3, then 6 dots). */
export default function Stars({ value, max = 3 }: { value: number; max?: number }) {
  const shapes = [[1], [1, 2, 4], [1, 2, 3, 4, 5, 6]];
  return (
    <span className="stars" role="img" aria-label={`${value} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Cell key={i} dots={i < value ? shapes[i] : []} size="sm" tone="marigold" flat="ghost" pop={i < value} />
      ))}
    </span>
  );
}
