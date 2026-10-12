/**
 * Perkins brailler key layout, and the six-key computer keyboard entry that copies it.
 *
 * A Perkins brailler has, left to right: dot 3, dot 2, dot 1, the space bar, dot 4, dot 5, dot 6.
 * Index, middle and ring fingers of the left hand press dots 1, 2, 3; of the right hand dots 4, 5, 6.
 * Six-key entry on a QWERTY keyboard puts the same fingers on S D F (dots 3 2 1) and J K L
 * (dots 4 5 6), with the space bar between them. Keys are pressed together as a chord, and the
 * cell is written when the chord is released.
 *
 * Source: Perkins School for the Blind, Perkins Brailler user documentation (key order), and the
 * standard six-key braille entry used by braille notetakers and screen readers.
 */
import type { Cell, Dot } from './ueb';
import { toCell } from './ueb';

/** Perkins keys from left to right. */
export const PERKINS_KEYS_LEFT_TO_RIGHT: readonly (Dot | 'space')[] = [3, 2, 1, 'space', 4, 5, 6];

/** Six-key keyboard entry: keyboard key → dot. */
export const SIX_KEY_TO_DOT: Readonly<Record<string, Dot>> = {
  f: 1,
  d: 2,
  s: 3,
  j: 4,
  k: 5,
  l: 6,
};

/** Dot → keyboard key, for hints ("press F and J"). */
export const DOT_TO_SIX_KEY: Readonly<Record<Dot, string>> = Object.fromEntries(
  Object.entries(SIX_KEY_TO_DOT).map(([k, d]) => [d, k]),
) as Record<Dot, string>;

/** "S D F = dots 3, 2, 1 · J K L = dots 4, 5, 6", generated from the layout above. */
export const SIX_KEY_HINT: string = (() => {
  const left = (PERKINS_KEYS_LEFT_TO_RIGHT.slice(0, 3) as Dot[]).map((d) => [DOT_TO_SIX_KEY[d], d] as const);
  const right = (PERKINS_KEYS_LEFT_TO_RIGHT.slice(4) as Dot[]).map((d) => [DOT_TO_SIX_KEY[d], d] as const);
  const side = (xs: readonly (readonly [string, Dot])[]) =>
    `${xs.map(([k]) => k.toUpperCase()).join(' ')} = dots ${xs.map(([, d]) => d).join(', ')}`;
  return `${side(left)} · ${side(right)}`;
})();

/** Keyboard keys (upper case) to press together for a cell, left to right on the keyboard. */
export function keysForCell(cell: Cell): string[] {
  const order: Dot[] = [3, 2, 1, 4, 5, 6];
  return order.filter((d) => cell.includes(d)).map((d) => DOT_TO_SIX_KEY[d].toUpperCase());
}

/**
 * Chord recogniser. Feed it keydown/keyup events (lower-cased `event.key`); it returns a cell
 * when every pressed dot key has been released, or 'space' for the space bar.
 */
export class ChordReader {
  private down = new Set<string>();
  private chord = new Set<Dot>();

  keyDown(key: string): boolean {
    const k = key.toLowerCase();
    if (k in SIX_KEY_TO_DOT) {
      this.down.add(k);
      this.chord.add(SIX_KEY_TO_DOT[k]);
      return true;
    }
    return false;
  }

  /** Returns the finished cell when the last key of a chord is released, else null. */
  keyUp(key: string): Cell | null {
    const k = key.toLowerCase();
    if (!(k in SIX_KEY_TO_DOT)) return null;
    this.down.delete(k);
    if (this.down.size === 0 && this.chord.size > 0) {
      const cell = toCell([...this.chord]);
      this.chord.clear();
      return cell;
    }
    return null;
  }

  reset(): void {
    this.down.clear();
    this.chord.clear();
  }
}
