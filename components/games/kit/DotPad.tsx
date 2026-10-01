'use client';

import { useCallback } from 'react';
import { describe } from '@/lib/ueb';
import { useGameKeys } from './useGameKeys';

/** Perkins brailler keys: F D S = dots 1 2 3, J K L = dots 4 5 6. */
export const PERKINS_KEYS: Record<string, number> = { f: 1, d: 2, s: 3, j: 4, k: 5, l: 6 };
const GRID = [1, 4, 2, 5, 3, 6];

interface DotPadProps {
  value: number[];
  onChange: (dots: number[]) => void;
  /** Called on Enter. */
  onSubmit?: () => void;
  disabled?: boolean;
  /** Listen for 1–6 / FDSJKL / Enter / Backspace on the whole page. */
  keyboard?: boolean;
  /** Show dot numbers on the buttons. */
  showNumbers?: boolean;
  /** Per-dot state for feedback after checking. */
  marks?: Partial<Record<number, 'correct' | 'missing' | 'extra'>>;
  label?: string;
  size?: 'md' | 'lg';
}

/**
 * A big, touch-friendly six-dot cell you can write on. Each dot is a toggle button with
 * aria-pressed, laid out like a real cell (1 2 3 down the left, 4 5 6 down the right).
 */
export default function DotPad({
  value,
  onChange,
  onSubmit,
  disabled,
  keyboard = true,
  showNumbers = true,
  marks,
  label = 'Braille cell',
  size = 'lg',
}: DotPadProps) {
  const toggle = useCallback(
    (n: number) => {
      if (disabled) return;
      const next = value.includes(n) ? value.filter((d) => d !== n) : [...value, n].sort((a, b) => a - b);
      onChange(next);
    },
    [value, onChange, disabled],
  );

  useGameKeys(
    (e) => {
      const k = e.key.toLowerCase();
      if (/^[1-6]$/.test(k)) {
        e.preventDefault();
        toggle(Number(k));
      } else if (k in PERKINS_KEYS) {
        e.preventDefault();
        toggle(PERKINS_KEYS[k]);
      } else if (e.key === 'Enter' && onSubmit && !(e.target instanceof HTMLButtonElement)) {
        // (Enter on a focused dot is handled by the dot's own onKeyDown.)
        e.preventDefault();
        onSubmit();
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        if (!disabled) onChange([]);
      }
    },
    { enabled: keyboard && !disabled },
  );

  return (
    <div className={`dotpad dotpad--${size}`} role="group" aria-label={`${label}. Raised: ${describe(value)}`}>
      {GRID.map((n) => {
        const on = value.includes(n);
        const mark = marks?.[n];
        return (
          <button
            key={n}
            type="button"
            className={`dotpad-dot${on ? ' is-on' : ''}${mark ? ` is-${mark}` : ''}`}
            aria-pressed={on}
            aria-label={`Dot ${n}`}
            disabled={disabled}
            onClick={() => toggle(n)}
            onKeyDown={(e) => {
              // Enter checks the cell (like a Perkins brailler's line key); Space toggles the dot.
              if (e.key === 'Enter' && onSubmit) {
                e.preventDefault();
                e.stopPropagation();
                onSubmit();
              }
            }}
          >
            {showNumbers && <span aria-hidden="true">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}
