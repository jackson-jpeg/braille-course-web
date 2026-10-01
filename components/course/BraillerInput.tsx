'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { describeDots, type CharItem } from '@/lib/course-curriculum';

/**
 * Perkins-style six-key chorded cell writer — the course's signature mechanic.
 *
 * The learner *writes* a character by raising its dots, then checks it. Input is
 * validated against the canonical pattern (`target.pattern`), so the drill can
 * never disagree with the rest of the site. Fully keyboard-operable:
 *   • Dot keys — F D S (left column, dots 1-2-3) and J K L (right column, dots 4-5-6)
 *   • Number keys 1–6 also toggle their dot
 *   • Enter / Space checks · Backspace / C clears
 *   • Or tap the six dots directly (touch / mouse)
 */

// Grid order is [d1, d4, d2, d5, d3, d6]. Map each key to its grid index.
const DOT_NUMBERS = [1, 4, 2, 5, 3, 6];
const KEY_TO_INDEX: Record<string, number> = {
  f: 0, // dot 1
  d: 2, // dot 2
  s: 4, // dot 3
  j: 1, // dot 4
  k: 3, // dot 5
  l: 5, // dot 6
  '1': 0,
  '2': 2,
  '3': 4,
  '4': 1,
  '5': 3,
  '6': 5,
};

function patternsEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

interface BraillerInputProps {
  target: CharItem;
  /** Called once when the learner writes the target correctly. `firstTry` is
   *  true if they got it with no wrong checks (used for lesson scoring). */
  onSolved: (firstTry: boolean) => void;
  /** Whether this target has already been solved (locks the input). */
  solved: boolean;
}

export default function BraillerInput({ target, onSolved, solved }: BraillerInputProps) {
  const [dots, setDots] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [message, setMessage] = useState('');
  const groupRef = useRef<HTMLDivElement>(null);
  const missedRef = useRef(false);

  // Reset when the target changes.
  useEffect(() => {
    setDots([0, 0, 0, 0, 0, 0]);
    setStatus('idle');
    setMessage('');
    missedRef.current = false;
  }, [target]);

  const toggle = useCallback(
    (index: number) => {
      if (solved) return;
      setStatus('idle');
      setMessage('');
      setDots((prev) => {
        const next = [...prev];
        next[index] = next[index] ? 0 : 1;
        return next;
      });
    },
    [solved],
  );

  const clear = useCallback(() => {
    if (solved) return;
    setDots([0, 0, 0, 0, 0, 0]);
    setStatus('idle');
    setMessage('');
  }, [solved]);

  const check = useCallback(() => {
    if (solved) return;
    if (patternsEqual(dots, target.pattern)) {
      setStatus('correct');
      setMessage(`Correct! “${target.print}” is ${describeDots(target.pattern)}.`);
      onSolved(!missedRef.current);
    } else {
      missedRef.current = true;
      setStatus('wrong');
      const entered = describeDots(dots);
      setMessage(
        `Not quite — you wrote ${entered}. “${target.print}” is ${describeDots(target.pattern)}. Adjust the dots and check again.`,
      );
    }
  }, [dots, target, onSolved, solved]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (solved) return;
      const key = e.key.toLowerCase();
      if (key in KEY_TO_INDEX) {
        e.preventDefault();
        toggle(KEY_TO_INDEX[key]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        check();
      } else if (e.key === 'Backspace' || key === 'c') {
        e.preventDefault();
        clear();
      }
    },
    [toggle, check, clear, solved],
  );

  return (
    <div className={`brailler${solved ? ' brailler--solved' : ''} brailler--${status}`}>
      <div className="brailler-prompt">
        <span className="brailler-prompt-label">Write:</span>
        <span className="brailler-prompt-char">{target.print}</span>
      </div>

      <div
        ref={groupRef}
        className="brailler-cell"
        role="group"
        tabIndex={0}
        aria-label={`Braille writer for ${target.print}. Use keys F D S and J K L, number keys 1 to 6, or tap the dots to raise them, then press Enter to check.`}
        onKeyDown={handleKeyDown}
      >
        {dots.map((raised, i) => (
          <button
            key={i}
            type="button"
            className={`brailler-dot${raised ? ' raised' : ''}`}
            aria-pressed={raised === 1}
            aria-label={`Dot ${DOT_NUMBERS[i]}`}
            onClick={() => toggle(i)}
            disabled={solved}
          >
            <span aria-hidden="true">{DOT_NUMBERS[i]}</span>
          </button>
        ))}
      </div>

      <div className="brailler-actions">
        <button type="button" className="brailler-btn brailler-btn--check" onClick={check} disabled={solved}>
          Check
        </button>
        <button type="button" className="brailler-btn brailler-btn--clear" onClick={clear} disabled={solved}>
          Clear
        </button>
      </div>

      <p className="brailler-hint">
        Keys <kbd>F</kbd> <kbd>D</kbd> <kbd>S</kbd> and <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd> (or <kbd>1</kbd>–
        <kbd>6</kbd>) raise dots · <kbd>Enter</kbd> checks
      </p>

      <p className={`brailler-status brailler-status--${status}`} role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
