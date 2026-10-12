import BrailleCell from '@/components/BrailleCell';
import { type BrailleToken, transcribeTokens } from '@/lib/braille/transcribe';
import { describeCells } from '@/lib/braille/prose';

/**
 * A run of braille cells for a piece of print, transcribed to uncontracted UEB by
 * lib/braille/transcribe.ts. Optionally labels each token underneath ("capital", "h", "3").
 *
 * Screen readers get one description of the whole run: either the dot numbers cell by cell
 * (default — so the braille is not given away as print) or a caller-supplied label.
 */
interface BrailleTextProps {
  /** Print to show in braille. Either this or `tokens`. */
  text?: string;
  tokens?: BrailleToken[];
  className?: string;
  cellClassName?: string;
  dotClassName?: string;
  raisedClassName?: string;
  flatClassName?: string;
  /** Show a small caption under each token. */
  showLabels?: boolean;
  /** Index of a token to highlight (e.g. the one being asked about). */
  highlight?: number;
  /** Accessible label; defaults to the dot numbers of every cell. */
  label?: string;
}

export function tokenCaption(t: BrailleToken): string {
  switch (t.kind) {
    case 'space':
      return 'space';
    case 'letter':
      // The cell is the lowercase letter; a capital is shown by the indicator token before it.
      return t.print.toLowerCase();
    case 'digit':
      return t.print;
    case 'indicator':
      return t.name.replace(/ indicator$/, '');
    default:
      return t.print || t.name;
  }
}

/** Split tokens into words; each space token is kept at the end of the word before it. */
function words(toks: BrailleToken[]): { t: BrailleToken; i: number }[][] {
  const out: { t: BrailleToken; i: number }[][] = [[]];
  toks.forEach((t, i) => {
    out[out.length - 1].push({ t, i });
    if (t.kind === 'space') out.push([]);
  });
  return out.filter((w) => w.length > 0);
}

export default function BrailleText({
  text,
  tokens,
  className = 'braille-text',
  cellClassName = 'braille-text-cell',
  dotClassName = 'braille-text-dot',
  raisedClassName,
  flatClassName,
  showLabels = false,
  highlight,
  label,
}: BrailleTextProps) {
  const toks = tokens ?? transcribeTokens(text ?? '');
  const sr = label ?? `Braille: ${describeCells(toks.flatMap((t) => t.cells))}`;
  return (
    <div className={className} role="img" aria-label={sr}>
      {/* Tokens are grouped into words so a line only ever breaks at a space, never inside a word. */}
      {words(toks).map((word, w) => (
        <span key={w} className="braille-text-word">
          {word.map(({ t, i }) => (
            <span
              key={i}
              className={`braille-text-token braille-text-token--${t.kind}${i === highlight ? ' braille-text-token--highlight' : ''}`}
              aria-hidden="true"
            >
              <span className="braille-text-cells">
                {t.cells.map((c, j) => (
                  <BrailleCell
                    key={j}
                    cell={c}
                    className={cellClassName}
                    dotClassName={dotClassName}
                    raisedClassName={raisedClassName}
                    flatClassName={flatClassName}
                  />
                ))}
              </span>
              {showLabels && <span className="braille-text-caption">{tokenCaption(t)}</span>}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
