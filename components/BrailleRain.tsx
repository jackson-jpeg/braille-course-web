'use client';

import '@/styles/games/braille-rain.css';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  Hud,
  ModePicker,
  Results,
  StartPanel,
  dotSimilarity,
  sample,
  shuffle,
  useAnnouncer,
  useGameKeys,
  useSession,
} from '@/components/games/kit';
import Cell from '@/components/ui/Cell';
import { ALPHABET, LETTERS, describe } from '@/lib/ueb';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import type { Difficulty } from '@/lib/progress-types';

/* ── Rules ───────────────────────────────────────────────────────────────── */

const MAX_LIVES = 3;
const WIN_SCORE = 10; // a solid falling run counts as a win
const RELAXED_TARGET = 15; // relaxed mode: catch this many cells
const RELAXED_QUEUE = 3; // relaxed mode: cells waiting at once
const MAX_DROPS = 8;
const FALL_PX = 380; // legacy tuning: speeds in lib/difficulty-settings are px/s over this distance
const TICK_MS = 100;

type Mode = 'falling' | 'relaxed';
type Phase = 'ready' | 'playing' | 'over';

interface Drop {
  id: number;
  letter: string;
  /** Percent from the left of the field. */
  x: number;
  /** Game-clock ms when it appeared (the game clock stops while paused). */
  born: number;
  /** How long it takes to land, in ms. */
  duration: number;
}

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Drizzle', hint: 'slow and steady' },
  { value: 'intermediate', label: 'Shower', hint: 'a bit faster' },
  { value: 'advanced', label: 'Storm', hint: 'fast, look-alike cells' },
];

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: 'falling', label: 'Falling', hint: `catch them before they land` },
  { value: 'relaxed', label: 'Relaxed', hint: `no timer · catch ${RELAXED_TARGET}` },
];

function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Pick a letter; on Storm, often one whose cell looks like the last one. */
function pickLetter(last: string | null, lookAlike: boolean): string {
  if (lookAlike && last && Math.random() < 0.5) {
    const near = shuffle(ALPHABET.filter((l) => l !== last))
      .sort((a, b) => dotSimilarity(LETTERS[last], LETTERS[b]) - dotSimilarity(LETTERS[last], LETTERS[a]))
      .slice(0, 6);
    return sample(near);
  }
  return sample(ALPHABET);
}

/** Braille Rain: cells fall; type each one's letter before it lands. */
export default function BrailleRain() {
  const { difficulty, setDifficulty, stats, finish, answer } = useSession('rain');
  const { announce, region } = useAnnouncer();
  const params = getDifficultyParams('rain', difficulty) as {
    fallSpeed: number;
    spawnMs: number;
    similarLetters: boolean;
  };

  const [mode, setMode] = useState<Mode>('falling');
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<Phase>('ready');
  const [paused, setPaused] = useState(false);
  const [drops, setDrops] = useState<Drop[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [misses, setMisses] = useState(0);
  const [clock, setClock] = useState(0);
  const [wrong, setWrong] = useState<{ letter: string; key: number } | null>(null);
  const [newBest, setNewBest] = useState(false);

  const dropsRef = useRef<Drop[]>([]);
  const clockRef = useRef(0);
  const lastTickRef = useRef(0);
  const nextSpawnRef = useRef(0);
  const idRef = useRef(0);
  const lastLetterRef = useRef<string | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const missesRef = useRef(0);
  const phaseRef = useRef<Phase>('ready');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reduced motion: cells wait in a row with a countdown instead of falling.
  useEffect(() => {
    let mq: MediaQueryList | undefined;
    try {
      mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    } catch {
      mq = undefined;
    }
    setReduced(prefersReducedMotion());
    if (!mq?.addEventListener) return;
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq?.removeEventListener('change', onChange);
  }, []);

  const commit = (next: Drop[]) => {
    dropsRef.current = next;
    setDrops(next);
  };

  const makeDrop = (): Drop => {
    const letter = pickLetter(lastLetterRef.current, params.similarLetters);
    lastLetterRef.current = letter;
    const lastX = dropsRef.current[dropsRef.current.length - 1]?.x ?? -100;
    let x = 8 + Math.random() * 80;
    for (let i = 0; i < 5 && Math.abs(x - lastX) < 16; i++) x = 8 + Math.random() * 80;
    const speed = params.fallSpeed * (1 + scoreRef.current * 0.02);
    return { id: idRef.current++, letter, x, born: clockRef.current, duration: (FALL_PX / speed) * 1000 };
  };

  const spawn = (count = 1) => {
    const added: Drop[] = [];
    for (let i = 0; i < count; i++) {
      if (dropsRef.current.length + added.length >= MAX_DROPS) break;
      const d = makeDrop();
      dropsRef.current = [...dropsRef.current, d];
      added.push(d);
    }
    commit(dropsRef.current);
    if (added.length && mode === 'falling') announce(`New cell: ${describe(LETTERS[added[added.length - 1].letter])}.`);
  };

  const end = () => {
    if (phaseRef.current !== 'playing') return;
    phaseRef.current = 'over';
    const s = scoreRef.current;
    setNewBest(s > stats.bestScore);
    finish(mode === 'relaxed' ? missesRef.current <= 5 : s >= WIN_SCORE, s);
    commit([]);
    setPaused(false);
    setPhase('over');
  };

  /** One step of the game clock: land drops, spawn new ones. Runs on setInterval, never on rAF. */
  const tick = () => {
    if (phaseRef.current !== 'playing') return;
    const now = performance.now();
    const dt = Math.min(now - lastTickRef.current, 250);
    lastTickRef.current = now;
    clockRef.current += dt;
    const t = clockRef.current;

    const landed = dropsRef.current.filter((d) => t - d.born >= d.duration);
    if (landed.length) {
      commit(dropsRef.current.filter((d) => t - d.born < d.duration));
      for (const d of landed) answer(`letter:${d.letter}`, false);
      livesRef.current = Math.max(0, livesRef.current - landed.length);
      setLives(livesRef.current);
      const d = landed[0];
      announce(
        `Missed! That cell, ${describe(LETTERS[d.letter])}, was ${d.letter}. ${livesRef.current} ${livesRef.current === 1 ? 'life' : 'lives'} left.`,
      );
      if (livesRef.current <= 0) {
        end();
        return;
      }
    }
    if (t >= nextSpawnRef.current || dropsRef.current.length === 0) {
      spawn();
      nextSpawnRef.current = t + params.spawnMs;
    }
    if (reduced) setClock(t);
  };

  const tickRef = useRef(tick);
  tickRef.current = tick;

  // The game clock: a plain interval, only while falling, playing and not paused.
  useEffect(() => {
    if (phase !== 'playing' || paused || mode !== 'falling') return;
    lastTickRef.current = performance.now();
    const id = setInterval(() => tickRef.current(), TICK_MS);
    return () => clearInterval(id);
  }, [phase, paused, mode]);

  // Pause automatically when the tab is hidden.
  useEffect(() => {
    if (phase !== 'playing') return;
    const onVis = () => {
      if (document.hidden) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [phase]);

  const start = () => {
    dropsRef.current = [];
    clockRef.current = 0;
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    missesRef.current = 0;
    lastLetterRef.current = null;
    phaseRef.current = 'playing';
    nextSpawnRef.current = params.spawnMs;
    setScore(0);
    setLives(MAX_LIVES);
    setMisses(0);
    setClock(0);
    setWrong(null);
    setNewBest(false);
    setPaused(false);
    setPhase('playing');
    spawn(mode === 'relaxed' ? RELAXED_QUEUE : 1);
    if (mode === 'relaxed')
      announce(`Three cells are waiting. First: ${describe(LETTERS[dropsRef.current[0].letter])}.`);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const togglePause = () => {
    if (phaseRef.current !== 'playing') return;
    setPaused((p) => {
      announce(p ? 'Resumed.' : 'Paused. Press Space or Escape, or the Resume button, to carry on.');
      return !p;
    });
  };

  const typeLetter = (raw: string) => {
    if (phaseRef.current !== 'playing' || paused) return;
    const letter = raw.toLowerCase();
    if (!/^[a-z]$/.test(letter)) return;
    const matches = dropsRef.current.filter((d) => d.letter === letter);
    if (matches.length === 0) {
      missesRef.current += 1;
      setMisses(missesRef.current);
      setWrong({ letter, key: Date.now() });
      announce(`No ${letter} cell there.`);
      return;
    }
    const t = clockRef.current;
    // Clear the one closest to landing (in Relaxed, the first in line).
    const target =
      mode === 'relaxed'
        ? matches[0]
        : matches.reduce((a, b) => ((t - b.born) / b.duration > (t - a.born) / a.duration ? b : a));
    commit(dropsRef.current.filter((d) => d.id !== target.id));
    scoreRef.current += 1;
    setScore(scoreRef.current);
    setWrong(null);
    answer(`letter:${letter}`, true);
    if (mode === 'relaxed') {
      if (scoreRef.current >= RELAXED_TARGET) {
        announce(`Caught ${letter}! That’s all ${RELAXED_TARGET}.`);
        end();
        return;
      }
      spawn();
      announce(`Caught ${letter}! Next: ${describe(LETTERS[dropsRef.current[0].letter])}.`);
    } else {
      announce(`Caught ${letter}!`);
    }
  };

  useGameKeys((e) => {
    const onButton = e.target instanceof HTMLButtonElement;
    if (phase === 'ready') {
      if (e.key === 'Enter' && !onButton) {
        e.preventDefault();
        start();
      }
      return;
    }
    if (phase !== 'playing') return;
    if (e.key === 'Escape' || (e.key === ' ' && !onButton)) {
      e.preventDefault();
      togglePause();
    } else if (e.key.length === 1 && /[a-z]/i.test(e.key)) {
      e.preventDefault();
      typeLetter(e.key);
    }
  });

  // The on-screen text box (for tablets and phones): each typed letter is played, then cleared.
  const onInput = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    e.target.value = '';
    for (const ch of v) typeLetter(ch);
  };
  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' || e.key === ' ') {
      e.preventDefault();
      togglePause();
    }
  };

  useEffect(() => {
    if (!wrong) return;
    const id = setTimeout(() => setWrong(null), 900);
    return () => clearTimeout(id);
  }, [wrong]);

  const staticView = mode === 'relaxed' || reduced;
  const t = reduced ? clock : clockRef.current;
  const queue = [...drops].sort((a, b) => a.born + a.duration - (b.born + b.duration));

  return (
    <div className="game-board rain-board" data-testid="game-board">
      {region}

      {phase === 'ready' && (
        <StartPanel heading="Ready for the rain?" onStart={start}>
          <p className="game-prompt-sub">
            Braille cells fall from the sky. Type each cell’s letter to catch it before it lands. You have three lives.
          </p>
          <div className="rain-options">
            <ModePicker legend="Speed" name="rain-level" value={difficulty} options={LEVELS} onChange={setDifficulty} />
            <ModePicker legend="Mode" name="rain-mode" value={mode} options={MODES} onChange={setMode} />
          </div>
          {reduced && mode === 'falling' && (
            <p className="rain-note">
              Reduced motion is on, so cells wait in a row with a countdown instead of falling.
            </p>
          )}
          <p className="rain-note">Press Space or Escape at any time to pause.</p>
        </StartPanel>
      )}

      {phase === 'playing' && (
        <>
          <div className="game-board-toolbar">
            <Hud
              items={
                mode === 'falling'
                  ? [
                      { label: 'Caught', value: score },
                      {
                        label: 'Lives',
                        value: (
                          <>
                            <span aria-hidden="true" className="rain-hearts">
                              {'♥'.repeat(lives)}
                              {'♡'.repeat(MAX_LIVES - lives)}
                            </span>
                            <span className="sr-only">
                              {lives} of {MAX_LIVES}
                            </span>
                          </>
                        ),
                        tone: lives <= 1 ? 'warn' : 'default',
                      },
                    ]
                  : [
                      { label: 'Caught', value: `${score} of ${RELAXED_TARGET}` },
                      { label: 'Misses', value: misses },
                    ]
              }
            />
            <button type="button" className="btn btn--paper btn--sm rain-pause" onClick={togglePause}>
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>

          <h2 className="sr-only">{mode === 'relaxed' ? 'Waiting cells' : 'Falling cells'}</h2>

          <div
            className={`rain-sky${paused ? ' is-paused' : ''}${wrong ? ' is-wrong' : ''}${staticView ? ' is-static' : ''}`}
          >
            {staticView ? (
              <ol className="rain-queue" data-testid="rain-queue">
                {queue.map((d, i) => {
                  const left = mode === 'falling' ? Math.max(0, 1 - (t - d.born) / d.duration) : 1;
                  return (
                    <li key={d.id} className={`rain-slot${i === 0 ? ' is-next' : ''}`}>
                      <Cell dots={LETTERS[d.letter]} size="lg" framed label={`Cell ${i + 1}`} />
                      {mode === 'falling' && (
                        <span className={`rain-meter${left < 0.3 ? ' is-low' : ''}`} aria-hidden="true">
                          <span style={{ width: `${left * 100}%` }} />
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <ul className="rain-field">
                {drops.map((d) => (
                  <li
                    key={d.id}
                    className="rain-drop"
                    style={{ left: `${d.x}%`, '--fall-ms': `${d.duration}ms` } as CSSProperties}
                  >
                    <Cell dots={LETTERS[d.letter]} size="md" framed label="Falling cell" />
                  </li>
                ))}
              </ul>
            )}
            <div className="rain-ground" aria-hidden="true" />
            {paused && (
              <div className="rain-paused">
                <p className="rain-paused-title">Paused</p>
                <button type="button" className="btn btn--pine" onClick={togglePause}>
                  Resume
                </button>
              </div>
            )}
          </div>

          <div className="rain-type">
            <label htmlFor="rain-input" className="rain-type-label">
              Type the letters here — or just type anywhere
            </label>
            <input
              id="rain-input"
              ref={inputRef}
              className="input rain-input"
              onChange={onInput}
              onKeyDown={onInputKey}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              enterKeyHint="go"
            />
            <p className="rain-status" aria-hidden="true">
              {wrong ? (
                <span key={wrong.key} className="rain-wrong">
                  ✗ No “{wrong.letter}” cell
                </span>
              ) : (
                ' '
              )}
            </p>
          </div>
        </>
      )}

      {phase === 'over' && (
        <Results
          title={
            mode === 'relaxed'
              ? 'All caught!'
              : score >= WIN_SCORE
                ? 'Great run!'
                : score > 0
                  ? 'The rain won this time'
                  : 'Game over'
          }
          summary={
            mode === 'relaxed'
              ? `${score} cells caught with ${misses} ${misses === 1 ? 'miss' : 'misses'}`
              : `${score} ${score === 1 ? 'cell' : 'cells'} caught`
          }
          stars={
            mode === 'relaxed'
              ? misses === 0
                ? 3
                : misses <= 3
                  ? 2
                  : 1
              : score >= 25
                ? 3
                : score >= 15
                  ? 2
                  : score >= WIN_SCORE
                    ? 1
                    : 0
          }
          best={Math.max(stats.bestScore, score) > 0 ? `${Math.max(stats.bestScore, score)} caught` : undefined}
          isNewBest={newBest}
          onReplay={start}
        />
      )}
    </div>
  );
}
