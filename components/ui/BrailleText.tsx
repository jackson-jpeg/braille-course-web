import { transcribe, type Dots } from '@/lib/ueb';
import Cell, { type CellSize, type CellTone } from './Cell';

interface BrailleTextProps {
  /** Print text, transcribed to uncontracted UEB by lib/ueb.ts. */
  text?: string;
  /** Or pre-computed cells (e.g. contracted braille from lib/data/ueb-contracted.json). */
  cells?: Dots[];
  size?: CellSize;
  tone?: CellTone;
  pop?: boolean;
  flat?: 'pit' | 'quiet' | 'ghost';
  onInk?: boolean;
  /**
   * Accessible name for the whole run, e.g. 'The word "cat" in braille'. When omitted the
   * run is decorative (aria-hidden) — use that only when the print text is visible nearby.
   */
  label?: string;
  className?: string;
}

/** A run of braille cells. Blank cells (spaces) render as gaps. */
export default function BrailleText({
  text,
  cells,
  size = 'md',
  tone,
  pop,
  flat,
  onInk,
  label,
  className,
}: BrailleTextProps) {
  const list: Dots[] = cells ?? (text ? transcribe(text).map((c) => c.dots) : []);
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <span className={['braille-run', className].filter(Boolean).join(' ')} {...a11y} style={sizeVar(size)}>
      {list.map((dots, i) =>
        dots.length === 0 ? (
          <span key={i} className="cell-space" />
        ) : (
          <Cell key={i} dots={dots} size={size} tone={tone} pop={pop} flat={flat} onInk={onInk} />
        ),
      )}
    </span>
  );
}

function sizeVar(size: CellSize) {
  const map: Record<CellSize, string> = { xs: '0.32rem', sm: '0.48rem', md: '0.7rem', lg: '1.1rem', xl: '1.6rem' };
  return { '--cell-dot': map[size] } as React.CSSProperties;
}
