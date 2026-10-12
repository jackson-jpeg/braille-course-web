import type { CSSProperties } from 'react';
import { type Cell, type Dot, GRID_ORDER, dotPosition } from '@/lib/braille/ueb';
import { describeCell } from '@/lib/braille/prose';

/**
 * The one way a braille cell is drawn on this site.
 *
 * Dots are emitted in reading order of a two-column grid (1 4 / 2 5 / 3 6) AND each dot gets an
 * explicit grid column and row from `dotPosition`, so a stylesheet cannot move a dot to the wrong
 * place. Each dot carries `data-dot` and the wrapper carries `data-braille-cell` / `data-dots`;
 * the rendering tests (jsdom and real-browser geometry) check the drawn positions against the data.
 */
interface BrailleCellProps {
  /** Raised dots, from lib/braille. */
  cell: Cell;
  /** CSS class for the container. */
  className?: string;
  /** CSS class for each dot. */
  dotClassName?: string;
  /** Class added to raised dots (default "filled"). */
  raisedClassName?: string;
  /** Class added to flat dots (default "empty"). */
  flatClassName?: string;
  /** Show the dot number inside each dot. */
  showNumbers?: boolean;
  /**
   * Accessible name. When given, the cell is exposed as an image with this label followed by its
   * dot numbers. When omitted the cell is decorative (aria-hidden) and the surrounding control
   * must describe it.
   */
  label?: string;
  style?: CSSProperties;
}

export function dotStyle(dot: Dot): CSSProperties {
  const { column, row } = dotPosition(dot);
  return { gridColumn: column, gridRow: row };
}

export default function BrailleCell({
  cell,
  className,
  dotClassName = 'dot',
  raisedClassName = 'filled',
  flatClassName = 'empty',
  showNumbers = false,
  label,
  style,
}: BrailleCellProps) {
  const a11y = label
    ? { role: 'img' as const, 'aria-label': `${label}, ${describeCell(cell)}` }
    : { 'aria-hidden': true as const };
  return (
    <div
      className={className}
      data-braille-cell=""
      data-dots={cell.join('')}
      style={style}
      {...a11y}
    >
      {GRID_ORDER.map((dot) => {
        const raised = cell.includes(dot);
        return (
          <span
            key={dot}
            data-dot={dot}
            className={`${dotClassName} ${raised ? raisedClassName : flatClassName}`}
            style={dotStyle(dot)}
          >
            {showNumbers ? dot : null}
          </span>
        );
      })}
    </div>
  );
}
