import type { CSSProperties } from 'react';
import { describe, type Dots } from '@/lib/ueb';

/** Reading order of the 2×3 grid: row by row, left column then right. */
const GRID_ORDER = [1, 4, 2, 5, 3, 6];

export type CellSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type CellTone = 'tomato' | 'ink' | 'pine' | 'marigold';

export interface CellProps {
  /** Raised dot numbers (1–6). Take these from lib/ueb.ts — never type patterns by hand. */
  dots: Dots;
  size?: CellSize;
  tone?: CellTone;
  /** Paper tile behind the cell. */
  framed?: boolean;
  /** Raised dots pop up in reading order on mount. */
  pop?: boolean;
  /** Flat dots fade back (quiet) or show as outlines (ghost). */
  flat?: 'pit' | 'quiet' | 'ghost';
  onInk?: boolean;
  /**
   * Accessible name. When given, the cell is announced as an image, e.g. "letter b, dots 1 2".
   * When omitted, the cell is decorative (aria-hidden) and nearby text must carry the meaning.
   */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Cell({
  dots,
  size = 'md',
  tone = 'tomato',
  framed,
  pop,
  flat = 'pit',
  onInk,
  label,
  className,
  style,
}: CellProps) {
  const classes = [
    'cell',
    `cell--${size}`,
    tone !== 'tomato' && `cell--${tone}`,
    framed && 'cell--framed',
    pop && 'cell--pop',
    flat !== 'pit' && `cell--${flat}`,
    onInk && 'cell--on-ink',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const a11y = label
    ? { role: 'img' as const, 'aria-label': `${label}, ${describe(dots)}` }
    : { 'aria-hidden': true as const };

  let raisedIndex = 0;
  return (
    <span className={classes} style={style} {...a11y} data-dots={dots.join('')}>
      {GRID_ORDER.map((n) => {
        const raised = dots.includes(n);
        return (
          <span
            key={n}
            className={raised ? 'dot is-raised' : 'dot'}
            style={raised && pop ? ({ '--i': raisedIndex++ } as CSSProperties) : undefined}
          />
        );
      })}
    </span>
  );
}
