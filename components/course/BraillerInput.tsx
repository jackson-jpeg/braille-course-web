'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CharItem } from '@/lib/course-curriculum';
import { type Cell, type Dot, sameCell } from '@/lib/braille/ueb';
import { describeCell } from '@/lib/braille/prose';
import { SIX_KEY_TO_DOT } from '@/lib/braille/perkins';
import BrailleCell from '@/components/BrailleCell';
import BrailleDotPad, { toggleDot } from '@/components/BrailleDotPad';

/**
 * Perkins-style six-key cell writer, the course's signature mechanic.
 *
 * The learner writes each cell of the target by raising its dots, then checks it. Targets can be
 * several cells long (a capital letter, a number, a two-cell sign); the writer goes cell by cell.
 * Input is checked against the canonical cells from lib/braille. Fully keyboard-operable:
 *   • F D S raise dots 1 2 3 and J K L raise dots 4 5 6 (the Perkins brailler layout)
 *   • Number keys 1–6 also toggle their dot
 *   • Enter / Space checks · Backspace / C clears
 *   • Or tap the six dots directly
 */

const DIGIT_TO_DOT: Record<string, Dot> = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };

/** Keyboard key → dot (Perkins six-key layout, plus number keys). Exported for tests. */
export function dotForKey(key: string): Dot | undefined {
  const k = key.toLowerCase();
  return SIX_KEY_TO_DOT[k] ?? DIGIT_TO_DOT[k];
}

interface BraillerInputProps {
  target: CharItem;
  /** Called once when the learner writes every cell of the target. `firstTry` is true if no check was wrong. */
  onSolved: (firstTry: boolean) => void;
  solved: boolean;
}

export default function BraillerInput({ target, onSolved, solved }: BraillerInputProps) {
  const [dots, setDots] = useState<Cell>([]);
  const [cellIndex, setCellIndex] = useState(0);
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [message, setMessage] = useState('');
  const missedRef = useRef(false);
  const total = target.cells.length;
  const multi = total > 1;

  useEffect(() => {
    setDots([]);
    setCellIndex(0);
    setStatus('idle');
    setMessage('');
    missedRef.current = false;
  }, [target]);

  const toggle = useCallback(
    (dot: Dot) => {
      if (solved) return;
      setStatus('idle');
      setMessage('');
      setDots((prev) => toggleDot(prev, dot));
    },
    [solved],
  );

  const clear = useCallback(() => {
    if (solved) return;
    setDots([]);
    setStatus('idle');
    setMessage('');
  }, [solved]);

  const check = useCallback(() => {
    if (solved) return;
    const want = target.cells[cellIndex];
    const name = target.cellNames[cellIndex];
    if (sameCell(dots, want)) {
      setStatus('correct');
      setDots([]);
      if (cellIndex === total - 1) {
        setMessage(
          multi
            ? `Correct! “${target.print}” is ${total} cells: ${target.cells.map(describeCell).join(', then ')}.`
            : `Correct! “${target.print}” is ${describeCell(want)}.`,
        );
        onSolved(!missedRef.current);
      } else {
        setMessage(`Cell ${cellIndex + 1} is right: the ${name}. Now write cell ${cellIndex + 2} of ${total}.`);
        setCellIndex(cellIndex + 1);
      }
    } else {
      missedRef.current = true;
      setStatus('wrong');
      setMessage(
        `Not quite. You wrote ${describeCell(dots)}. ${multi ? `Cell ${cellIndex + 1} (the ${name})` : `“${target.print}”`} is ${describeCell(want)}. Adjust the dots and check again.`,
      );
    }
  }, [dots, target, cellIndex, total, multi, onSolved, solved]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (solved || e.ctrlKey || e.metaKey || e.altKey) return;
      const dot = dotForKey(e.key);
      if (dot) {
        e.preventDefault();
        toggle(dot);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        check();
      } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        clear();
      }
    },
    [toggle, check, clear, solved],
  );

  const writtenCells = target.cells.slice(0, solved ? total : cellIndex);

  return (
    <div className={`brailler${solved ? ' brailler--solved' : ''} brailler--${status}`}>
      <div className="brailler-prompt">
        <span className="brailler-prompt-label">Write:</span>
        <span className="brailler-prompt-char">{target.print}</span>
        {multi && (
          <span className="brailler-prompt-progress">
            {solved ? `${total} cells` : `cell ${cellIndex + 1} of ${total}`}
          </span>
        )}
      </div>

      {multi && (
        <div className="brailler-written" aria-label={`Cells written so far: ${writtenCells.length} of ${total}`}>
          {target.cells.map((c, i) => (
            <span key={i} className={`brailler-written-slot${i === cellIndex && !solved ? ' current' : ''}`}>
              {i < writtenCells.length ? (
                <BrailleCell cell={c} className="lesson-char-cell" dotClassName="lesson-char-dot" />
              ) : (
                <span className="brailler-written-empty" aria-hidden="true" />
              )}
            </span>
          ))}
        </div>
      )}

      <BrailleDotPad
        cell={dots}
        onToggle={toggle}
        className="brailler-cell"
        dotClassName="brailler-dot"
        raisedClassName="raised"
        disabled={solved}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        label={`Braille writer for ${target.print}${multi ? `, cell ${cellIndex + 1} of ${total}` : ''}. Use keys F D S and J K L, number keys 1 to 6, or tap the dots to raise them, then press Enter to check.`}
      />

      <div className="brailler-actions">
        <button type="button" className="brailler-btn brailler-btn--check" onClick={check} disabled={solved}>
          {multi && cellIndex < total - 1 ? 'Check cell' : 'Check'}
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
