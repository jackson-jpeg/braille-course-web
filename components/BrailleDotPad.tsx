'use client';

import { type Cell, type Dot, GRID_ORDER } from '@/lib/braille/ueb';
import { dotStyle } from '@/components/BrailleCell';

/**
 * Six toggle buttons laid out as a braille cell, for games where the learner raises dots.
 * Same placement guarantees as BrailleCell: explicit grid column/row per dot, `data-dot` on each
 * button, `data-braille-cell` + `data-dots` on the wrapper (checked by the rendering tests).
 */
interface BrailleDotPadProps {
  cell: Cell;
  onToggle: (dot: Dot) => void;
  className?: string;
  dotClassName?: string;
  raisedClassName?: string;
  disabled?: boolean;
  /** Accessible name of the group, e.g. "Braille writer". */
  label: string;
  showNumbers?: boolean;
  /** Extra content inside each button (e.g. a styled number). */
  renderDot?: (dot: Dot, raised: boolean) => React.ReactNode;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  tabIndex?: number;
  groupRef?: React.Ref<HTMLDivElement>;
}

export default function BrailleDotPad({
  cell,
  onToggle,
  className,
  dotClassName = 'dot',
  raisedClassName = 'raised',
  disabled = false,
  label,
  showNumbers = true,
  renderDot,
  onKeyDown,
  tabIndex,
  groupRef,
}: BrailleDotPadProps) {
  return (
    <div
      ref={groupRef}
      className={className}
      role="group"
      aria-label={label}
      data-braille-cell=""
      data-dots={cell.join('')}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
    >
      {GRID_ORDER.map((dot) => {
        const raised = cell.includes(dot);
        return (
          <button
            key={dot}
            type="button"
            data-dot={dot}
            className={`${dotClassName}${raised ? ` ${raisedClassName}` : ''}`}
            style={dotStyle(dot)}
            aria-pressed={raised}
            aria-label={`Dot ${dot}`}
            onClick={() => onToggle(dot)}
            disabled={disabled}
          >
            {renderDot ? renderDot(dot, raised) : showNumbers ? <span aria-hidden="true">{dot}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Toggle a dot in a cell (returns a new, sorted cell). */
export function toggleDot(cell: Cell, dot: Dot): Cell {
  return (cell.includes(dot) ? cell.filter((d) => d !== dot) : [...cell, dot].sort((a, b) => a - b)) as Cell;
}
