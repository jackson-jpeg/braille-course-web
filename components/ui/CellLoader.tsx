import Cell from './Cell';

/** Loading indicator: dots light up in reading order around the cell. */
export default function CellLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="cell-loader" role="status">
      <Cell dots={[]} size="lg" framed />
      <span>{label}…</span>
    </div>
  );
}
