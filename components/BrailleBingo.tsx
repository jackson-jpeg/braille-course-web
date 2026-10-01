'use client';

import '@/styles/games/bingo.css';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Cell from '@/components/ui/Cell';
import {
  Hud,
  ModePicker,
  Results,
  StartPanel,
  sample,
  shuffle,
  useAnnouncer,
  useGameKeys,
  useSession,
} from '@/components/games/kit';
import { ALPHABET, LETTERS, describe } from '@/lib/ueb';
import { DIFFICULTY_INFO, getDifficultyParams } from '@/lib/difficulty-settings';
import { getRandomTip } from '@/lib/learning-tips';
import type { Difficulty } from '@/lib/progress-types';

type Phase = 'start' | 'play' | 'done';
type Pace = 'own' | 'timed';
type Win = 'line' | 'double-line' | 'blackout';

const FREE = '';
const CENTER = 12;
const SIZE = 5;
const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const WIN_TEXT: Record<Win, string> = { line: 'one full line', 'double-line': 'two lines', blackout: 'the whole card' };

/** 5 rows, 5 columns and 2 diagonals. */
const LINES: number[][] = (() => {
  const out: number[][] = [];
  const r = [0, 1, 2, 3, 4];
  for (let i = 0; i < SIZE; i++)
    out.push(
      r.map((c) => i * SIZE + c),
      r.map((c) => c * SIZE + i),
    );
  out.push([0, 6, 12, 18, 24], [4, 8, 12, 16, 20]);
  return out;
})();

function levelParams(d: Difficulty) {
  const p = getDifficultyParams('bingo', d) as { winCondition?: Win; callIntervalMs?: number };
  return { win: p.winCondition ?? 'line', interval: p.callIntervalMs ?? 3500 };
}

function makeCard(): string[] {
  const pool = shuffle(ALPHABET).slice(0, 24);
  pool.splice(CENTER, 0, FREE);
  return pool;
}

function hasWon(marked: boolean[], win: Win) {
  if (win === 'blackout') return marked.every(Boolean);
  const lines = LINES.filter((l) => l.every((i) => marked[i])).length;
  return lines >= (win === 'double-line' ? 2 : 1);
}

const freshMarks = () => Array.from({ length: SIZE * SIZE }, (_, i) => i === CENTER);

export default function BrailleBingo() {
  const { difficulty, setDifficulty, stats, finish, answer } = useSession('bingo');
  const { announce, region } = useAnnouncer();
  const [phase, setPhase] = useState<Phase>('start');
  const [pace, setPace] = useState<Pace>('own');
  const [paused, setPaused] = useState(false);
  const [card, setCard] = useState<string[]>(makeCard);
  const [marked, setMarked] = useState<boolean[]>(freshMarks);
  const [called, setCalled] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [hints, setHints] = useState(0);
  const [misses, setMisses] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ good: boolean; text: string } | null>(null);
  const [result, setResult] = useState<{ score: number; best: number; isNewBest: boolean; tip: string } | null>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const keyMarkedAt = useRef(0);

  const { win, interval } = levelParams(difficulty);
  const current = called[0] ?? null;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const say = useCallback(
    (letter: string) => {
      if (!canSpeak) return;
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(letter));
      } catch {
        /* speech is a bonus */
      }
    },
    [canSpeak],
  );

  /** Call the next letter, leaning toward letters still unmarked on the card so rounds keep moving. */
  const callNext = useCallback(() => {
    const remaining = ALPHABET.filter((l) => !called.includes(l));
    if (!remaining.length) {
      announce('Every letter has been called. Mark any cells you missed.');
      return;
    }
    const onCard = remaining.filter((l) => card.includes(l) && !marked[card.indexOf(l)]);
    const next = onCard.length && Math.random() < 0.72 ? sample(onCard) : sample(remaining);
    setCalled([next, ...called]);
    setHint(false);
    setFeedback(null);
    announce(`Find the letter ${next}.`);
  }, [announce, called, card, marked]);

  // Timed calls (optional — "My pace" has no timer; Pause stops it). WCAG 2.2.1.
  const callRef = useRef(callNext);
  callRef.current = callNext;
  useEffect(() => {
    if (phase !== 'play' || pace !== 'timed' || paused) return;
    const id = setInterval(() => callRef.current(), interval);
    return () => clearInterval(id);
  }, [interval, pace, paused, phase]);

  const start = useCallback(() => {
    const fresh = makeCard();
    setCard(fresh);
    setMarked(freshMarks());
    setHints(0);
    setMisses(0);
    setFocusIdx(0);
    setPaused(false);
    setResult(null);
    setFeedback(null);
    setHint(false);
    const first = sample(fresh.filter(Boolean));
    setCalled([first]);
    setPhase('play');
    announce(`New card. Find the letter ${first}.`);
  }, [announce]);

  const mark = useCallback(
    (i: number) => {
      if (phase !== 'play') return;
      const letter = card[i];
      if (letter === FREE) {
        announce('Free space — it is already marked.');
        return;
      }
      if (marked[i]) {
        announce(`Already marked: ${letter}.`);
        return;
      }
      if (!called.includes(letter)) {
        if (current) answer(`letter:${current}`, false);
        setMisses((m) => m + 1);
        const text = current ? `Not that one — that cell hasn’t been called. Look for ${current}.` : 'Not called yet.';
        setFeedback({ good: false, text: `✗ ${text}` });
        announce(text);
        return;
      }
      answer(`letter:${letter}`, true);
      const next = marked.slice();
      next[i] = true;
      setMarked(next);
      setFeedback({ good: true, text: `✓ Yes! ${letter} is ${describe(LETTERS[letter])}.` });

      if (hasWon(next, win)) {
        const score = Math.max(5, 80 - called.length * 2 - hints * 3 - misses);
        const prevBest = stats.bestScore;
        finish(true, score);
        setResult({ score, best: Math.max(prevBest, score), isNewBest: score > prevBest, tip: getRandomTip().fact });
        setPhase('done');
        announce('Bingo!');
      } else {
        announce(`Marked ${letter}. ${pace === 'own' ? 'Press N for the next letter.' : ''}`);
      }
    },
    [announce, answer, called, card, current, finish, hints, marked, misses, pace, phase, stats.bestScore, win],
  );

  const onGridKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    let next = focusIdx;
    const r = Math.floor(focusIdx / SIZE);
    const c = focusIdx % SIZE;
    switch (e.key) {
      case 'ArrowRight':
        next = r * SIZE + Math.min(SIZE - 1, c + 1);
        break;
      case 'ArrowLeft':
        next = r * SIZE + Math.max(0, c - 1);
        break;
      case 'ArrowDown':
        next = Math.min(SIZE - 1, r + 1) * SIZE + c;
        break;
      case 'ArrowUp':
        next = Math.max(0, r - 1) * SIZE + c;
        break;
      case 'Home':
        next = r * SIZE;
        break;
      case 'End':
        next = r * SIZE + SIZE - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.stopPropagation();
        keyMarkedAt.current = Date.now();
        mark(focusIdx);
        return;
      default:
        return;
    }
    e.preventDefault();
    setFocusIdx(next);
    btnRefs.current[next]?.focus();
  };

  const showHint = () => {
    if (!current || hint) return;
    setHint(true);
    setHints((h) => h + 1);
    announce(`Hint: ${current} is ${describe(LETTERS[current])}.`);
  };

  useGameKeys((e) => {
    const onButton = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
    if (phase !== 'play') {
      if (e.key === 'Enter' && !onButton) {
        e.preventDefault();
        start();
      }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'n') {
      e.preventDefault();
      callNext();
    } else if (k === 'h') {
      e.preventDefault();
      showHint();
    } else if (k === 'p' && pace === 'timed') {
      e.preventDefault();
      setPaused((p) => !p);
      announce(paused ? 'Calls resumed.' : 'Paused.');
    } else if (k === 'r' && current) {
      e.preventDefault();
      announce(`Find the letter ${current}.`);
      say(current);
    }
  });

  const allCalled = called.length >= ALPHABET.length;

  return (
    <div className="game-board bingo" data-testid="game-board">
      {region}

      {phase === 'start' && (
        <StartPanel heading="Ready for Bingo?" onStart={start}>
          <p className="game-prompt-sub">
            A letter is called. Find its braille cell on your card and mark it. Get {WIN_TEXT[win]} to win.
          </p>
          <div className="bingo-options">
            <ModePicker
              legend="Level"
              name="bingo-level"
              value={difficulty}
              onChange={setDifficulty}
              options={LEVELS.map((d) => ({
                value: d,
                label: DIFFICULTY_INFO[d].label,
                hint: `Win: ${WIN_TEXT[levelParams(d).win]}`,
              }))}
            />
            <ModePicker
              legend="Calls"
              name="bingo-pace"
              value={pace}
              onChange={setPace}
              options={[
                { value: 'own', label: 'My pace', hint: 'Press Next letter' },
                { value: 'timed', label: 'Timed', hint: `Every ${interval / 1000} seconds` },
              ]}
            />
          </div>
        </StartPanel>
      )}

      {phase === 'play' && (
        <>
          <div className="game-board-toolbar">
            <Hud
              items={[
                { label: 'Called', value: called.length },
                { label: 'Marked', value: `${marked.filter(Boolean).length} / 25` },
                { label: 'Goal', value: WIN_TEXT[win] },
              ]}
            />
          </div>

          <div className="bingo-caller">
            <h2 className="bingo-caller-label">Find the letter</h2>
            <span className="bingo-call" aria-live="off">
              {current}
            </span>
            {hint && current && (
              <span className="bingo-hint">
                <Cell dots={LETTERS[current]} size="sm" framed />
                <span>{describe(LETTERS[current])}</span>
              </span>
            )}
            <div className="cluster bingo-caller-actions">
              {pace === 'own' ? (
                <button type="button" className="btn btn--sm" onClick={callNext} disabled={allCalled}>
                  Next letter
                </button>
              ) : (
                <button type="button" className="btn btn--paper btn--sm" onClick={() => setPaused((p) => !p)}>
                  {paused ? 'Resume calls' : 'Pause calls'}
                </button>
              )}
              <button type="button" className="btn btn--paper btn--sm" onClick={showHint} disabled={hint}>
                Hint
              </button>
              {canSpeak && current && (
                <button type="button" className="btn btn--paper btn--sm" onClick={() => say(current)}>
                  Say it
                </button>
              )}
            </div>
          </div>

          <div
            className="bingo-card"
            role="group"
            aria-label="Your bingo card, 5 by 5. Arrow keys move, Enter marks."
            onKeyDown={onGridKey}
          >
            {card.map((letter, i) => {
              const isFree = letter === FREE;
              const isMarked = marked[i];
              const row = Math.floor(i / SIZE) + 1;
              const col = (i % SIZE) + 1;
              const name = isFree
                ? `Row ${row}, column ${col}: free space`
                : `Row ${row}, column ${col}: ${isMarked ? `${letter}, ` : ''}${describe(LETTERS[letter])}`;
              return (
                <button
                  key={i}
                  ref={(el) => {
                    btnRefs.current[i] = el;
                  }}
                  type="button"
                  className={`bingo-cell${isMarked ? ' is-marked' : ''}${isFree ? ' is-free' : ''}`}
                  tabIndex={i === focusIdx ? 0 : -1}
                  aria-pressed={isMarked}
                  aria-label={name}
                  onFocus={() => setFocusIdx(i)}
                  onClick={(e) => {
                    // Skip the click some browsers still fire after a handled Space/Enter keydown.
                    if (e.detail === 0 && Date.now() - keyMarkedAt.current < 400) return;
                    mark(i);
                  }}
                >
                  {isFree ? (
                    <span className="bingo-free" aria-hidden="true">
                      Free
                    </span>
                  ) : (
                    <>
                      <Cell dots={LETTERS[letter]} size="sm" tone={isMarked ? 'ink' : 'tomato'} />
                      {isMarked && (
                        <span className="bingo-chip" aria-hidden="true">
                          {letter}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          <div className={`feedback ${feedback ? (feedback.good ? 'feedback--good' : 'feedback--bad') : ''}`}>
            {feedback && <span className="feedback-pill">{feedback.text}</span>}
          </div>

          {called.length > 1 && (
            <p className="bingo-called">
              <span className="bingo-called-label">Called so far:</span>{' '}
              {called.slice(1, 13).map((l) => (
                <span key={l} className="letter-chip">
                  {l}
                </span>
              ))}
            </p>
          )}
        </>
      )}

      {phase === 'done' && result && (
        <Results
          title="Bingo!"
          summary={`You got ${WIN_TEXT[win]} in ${called.length} calls · ${result.score} points`}
          stars={result.score >= 60 ? 3 : result.score >= 40 ? 2 : 1}
          best={`${result.best} points`}
          isNewBest={result.isNewBest}
          onReplay={start}
          replayLabel="New card"
        >
          {result.tip && <p className="bingo-tip">{result.tip}</p>}
        </Results>
      )}
    </div>
  );
}
