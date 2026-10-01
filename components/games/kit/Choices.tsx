'use client';

import type { ReactNode } from 'react';
import { useGameKeys } from './useGameKeys';

export interface Choice {
  id: string;
  /** Visible content (print letter, word, or a cell). */
  content: ReactNode;
  /** Accessible name when content is not plain text. */
  label?: string;
}

interface ChoicesProps {
  choices: Choice[];
  onPick: (id: string) => void;
  /** After answering: which id was right, and which the player picked. */
  correctId?: string | null;
  pickedId?: string | null;
  disabled?: boolean;
  /** Number keys 1–n pick answers. */
  keyboard?: boolean;
  /** Typing a choice's text (e.g. a letter) picks it. */
  typeToPick?: boolean;
  label?: string;
  layout?: 'row' | 'grid';
}

/** Answer buttons with number-key shortcuts and clear right/wrong states. */
export default function Choices({
  choices,
  onPick,
  correctId,
  pickedId,
  disabled,
  keyboard = true,
  typeToPick,
  label = 'Answers',
  layout = 'grid',
}: ChoicesProps) {
  useGameKeys(
    (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= choices.length) {
        e.preventDefault();
        onPick(choices[n - 1].id);
        return;
      }
      if (typeToPick && e.key.length === 1) {
        const hit = choices.find((c) => c.id.toLowerCase() === e.key.toLowerCase());
        if (hit) {
          e.preventDefault();
          onPick(hit.id);
        }
      }
    },
    { enabled: keyboard && !disabled },
  );

  return (
    <div className={`choices choices--${layout}`} role="group" aria-label={label}>
      {choices.map((c, i) => {
        const state =
          correctId != null && c.id === correctId
            ? 'is-correct'
            : pickedId != null && c.id === pickedId
              ? 'is-wrong'
              : '';
        return (
          <button
            key={c.id}
            type="button"
            className={`choice ${state}`}
            onClick={() => {
              if (!disabled) onPick(c.id);
            }}
            aria-disabled={disabled || undefined}
            aria-label={c.label ? `${i + 1}: ${c.label}` : undefined}
          >
            <span className="choice-key" aria-hidden="true">
              {i + 1}
            </span>
            <span className="choice-body">{c.content}</span>
          </button>
        );
      })}
    </div>
  );
}
