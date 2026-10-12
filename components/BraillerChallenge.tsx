'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Difficulty } from '@/lib/progress-types';
import { CHALLENGE_TARGETS, type WriterState, startWriting, writeCell } from '@/lib/games/brailler-challenge';
import { shuffle } from '@/lib/games/quiz';
import { ChordReader, SIX_KEY_HINT, keysForCell } from '@/lib/braille/perkins';
import { type Cell, type Dot } from '@/lib/braille/ueb';
import { describeCell } from '@/lib/braille/prose';
import { spellOut } from '@/lib/games/spell';
import BrailleCell from '@/components/BrailleCell';
import BrailleDotPad, { toggleDot } from '@/components/BrailleDotPad';
import DifficultySelector from '@/components/DifficultySelector';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';

/**
 * Brailler Challenge: write words and sentences the way a Perkins brailler does. Press the dot
 * keys of a cell together (layout in lib/braille/perkins.ts) and release them to write the cell;
 * the space bar writes a blank cell. On touch screens, tap the dots and press "Write cell".
 */

const TARGETS_PER_GAME = 5;

export default function BraillerChallenge() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('brailler-challenge');
  const [targets, setTargets] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [writer, setWriter] = useState<WriterState | null>(null);
  const [pad, setPad] = useState<Cell>([]);
  const [message, setMessage] = useState('');
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const [targetDone, setTargetDone] = useState(false);
  const [tip, setTip] = useState('');
  const chord = useRef(new ChordReader());
  const padRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    const list = shuffle(CHALLENGE_TARGETS[difficulty as Difficulty]).slice(0, TARGETS_PER_GAME);
    setTargets(list);
    setIndex(0);
    setWriter(startWriting(list[0]));
    setPad([]);
    setMessage('');
    setScore(0);
    setMistakes(0);
    setFinished(false);
    setTargetDone(false);
    setTip('');
    chord.current.reset();
  }, [difficulty]);

  useEffect(() => {
    start();
  }, [start]);

  const submit = useCallback(
    (cell: Cell) => {
      if (!writer || finished || targetDone) return;
      const exp = writer.expected[writer.position];
      const { state, result } = writeCell(writer, cell);
      setWriter(state);
      setPad([]);
      if (result === 'wrong') {
        setMistakes((m) => m + 1);
        setFlash('bad');
        const hint =
          state.misses >= 2
            ? ` Hint: the ${exp.name} is ${describeCell(exp.cell)}${exp.cell.length ? ` (keys ${keysForCell(exp.cell).join(' ')})` : ' (space bar)'}.`
            : '';
        setMessage(`You wrote ${describeCell(cell)}. That isn’t the next cell.${hint}`);
      } else {
        setScore((s) => s + 1);
        setFlash('ok');
        if (result === 'done') {
          setTargetDone(true);
          setMessage(`Written! “${writer.target}” is ${writer.expected.length} cells.`);
        } else {
          setMessage(`Yes: ${exp.name}.`);
        }
      }
      setTimeout(() => setFlash(null), 350);
    },
    [writer, finished, targetDone],
  );

  const nextTarget = useCallback(() => {
    const n = index + 1;
    if (n >= targets.length) {
      setFinished(true);
      pushAchievements(recordResult(mistakes <= targets.length * 2, score));
      setTip(getRandomTip().fact);
      return;
    }
    setIndex(n);
    setWriter(startWriting(targets[n]));
    setTargetDone(false);
    setMessage('');
    padRef.current?.focus();
  }, [index, targets, mistakes, score, recordResult]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (chord.current.keyDown(e.key)) {
        e.preventDefault();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        submit([]);
      } else if (e.key === 'Enter' && targetDone) {
        e.preventDefault();
        nextTarget();
      }
    },
    [submit, targetDone, nextTarget],
  );

  const onKeyUp = useCallback(
    (e: React.KeyboardEvent) => {
      const cell = chord.current.keyUp(e.key);
      if (cell) submit(cell);
    },
    [submit],
  );

  if (!writer) return null;
  const written = writer.expected.slice(0, writer.position);
  const current = writer.expected[writer.position];

  return (
    <div className="bchal">
      <div className="cgame-header">
        <span className="section-label">Writing</span>
        <h2>Brailler Challenge</h2>
        <p>
          Write it like a Perkins brailler: press the dot keys of a cell together, then let go.{' '}
          <span className="cgame-kbd-hint">{SIX_KEY_HINT} · Space = blank cell</span>
        </p>
        <DifficultySelector gameId="brailler-challenge" current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="cgame-body bchal-body">
        {!finished ? (
          <>
            <div className="cgame-status" aria-live="polite" aria-atomic="true">
              <span>
                Phrase {index + 1} / {targets.length}
              </span>
              <span>Cells: {score}</span>
              <span>Misses: {mistakes}</span>
            </div>

            <p className="cgame-question">Write this in braille:</p>
            <p className="cgame-print-lg bchal-target" aria-label={`Write: ${spellOut(writer.target)}`}>
              {writer.target}
            </p>

            <div
              className={`bchal-paper${flash ? ` bchal-paper--${flash}` : ''}`}
              aria-label={`Written so far: ${written.length} of ${writer.expected.length} cells`}
            >
              {writer.expected.map((e, i) => (
                <span key={i} className={`bchal-slot${i === writer.position && !targetDone ? ' current' : ''}`}>
                  {i < written.length ? (
                    <BrailleCell cell={e.cell} className="braille-text-cell" dotClassName="braille-text-dot" />
                  ) : (
                    <span className="bchal-slot-empty" aria-hidden="true" />
                  )}
                </span>
              ))}
            </div>

            <div
              className="bchal-keys"
              tabIndex={0}
              ref={padRef}
              role="application"
              aria-label="Brailler keyboard. Press S D F J K L together for a cell, space bar for a blank cell."
              aria-describedby="bchal-status"
              onKeyDown={onKeyDown}
              onKeyUp={onKeyUp}
            >
              <span className="bchal-keys-hint" aria-hidden="true">
                Click here, then type with S D F · J K L
              </span>
            </div>

            <div className="bchal-touch">
              <BrailleDotPad
                cell={pad}
                onToggle={(d: Dot) => setPad((p) => toggleDot(p, d))}
                className="bchal-pad"
                dotClassName="bchal-pad-dot"
                raisedClassName="raised"
                label="Touch writer: tap dots to raise them"
                disabled={targetDone}
              />
              <div className="bchal-touch-actions">
                <button
                  type="button"
                  className="cgame-next"
                  onClick={() => submit(pad)}
                  disabled={targetDone || pad.length === 0}
                >
                  Write cell
                </button>
                <button type="button" className="bchal-space" onClick={() => submit([])} disabled={targetDone}>
                  Space
                </button>
              </div>
            </div>

            <p
              id="bchal-status"
              className={`bchal-status${targetDone ? ' done' : ''}`}
              role="status"
              aria-live="polite"
            >
              {message || (current ? `Next: cell ${writer.position + 1} of ${writer.expected.length}.` : '')}
            </p>
            {targetDone && (
              <button type="button" className="cgame-next" onClick={nextTarget}>
                {index + 1 >= targets.length ? 'See results' : 'Next phrase'}
              </button>
            )}
          </>
        ) : (
          <div className="cgame-result">
            <div className="cgame-result-score">{score} cells</div>
            <div className="cgame-result-label">
              {mistakes === 0 ? 'Flawless writing!' : `${mistakes} miss${mistakes === 1 ? '' : 'es'}. Keep at it!`}
            </div>
            {tip && <p className="cgame-tip">{tip}</p>}
            <button type="button" className="cgame-again" onClick={start}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
