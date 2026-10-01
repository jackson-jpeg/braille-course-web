'use client';

import '@/styles/games/dot-builder.css';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Cell from '@/components/ui/Cell';
import { ALPHABET, LETTERS, describe, sameDots, transcribe, type Dots } from '@/lib/ueb';
import { WORD_DECODER_LEVELS } from '@/lib/games/word-decoder-content';
import {
  DotPad,
  Hud,
  ModePicker,
  Results,
  StartPanel,
  useAnnouncer,
  useGameKeys,
  useSession,
  shuffle,
  type HudItem,
} from '@/components/games/kit';

/* ── Settings ─────────────────────────────────────────────────────────────── */

type SetId = 'dots' | 'a-j' | 'k-t' | 'u-z' | 'a-z' | 'words';
type Pace = 'relaxed' | 'timed';

const SET_OPTIONS: { value: SetId; label: string; hint: string }[] = [
  { value: 'dots', label: 'Single dots', hint: 'Find dots 1 to 6' },
  { value: 'a-j', label: 'a–j', hint: 'The first ten' },
  { value: 'k-t', label: 'k–t', hint: 'a–j plus dot 3' },
  { value: 'u-z', label: 'u–z', hint: 'The last six' },
  { value: 'a-z', label: 'All letters', hint: 'a to z' },
  { value: 'words', label: 'Short words', hint: '3 or 4 letters' },
];
const PACE_OPTIONS: { value: Pace; label: string; hint: string }[] = [
  { value: 'relaxed', label: 'Relaxed', hint: 'No timer, 10 to build' },
  { value: 'timed', label: 'Timed', hint: '90 seconds on the clock' },
];
const NEXT: Record<SetId, { href: string; label: string }> = {
  dots: { href: '/games/dot-builder?set=a-j', label: 'Next: build letters a–j' },
  'a-j': { href: '/games/letter-race?set=a-j', label: 'Now read a–j in Letter Race' },
  'k-t': { href: '/games/letter-race?set=k-t', label: 'Now read k–t in Letter Race' },
  'u-z': { href: '/games/letter-race?set=u-z', label: 'Now read u–z in Letter Race' },
  'a-z': { href: '/games/letter-race?set=a-z', label: 'Now read them in Letter Race' },
  words: { href: '/games/word-decoder', label: 'Next: read words in Word Decoder' },
};

const ROUND = 10;
const TIMED_SECONDS = 90;
/** A timed round counts as a win at this many cells built. */
const TIMED_WIN = 10;
const MARK_MS = 1500;

function parseSet(v: string | null): SetId {
  return SET_OPTIONS.some((o) => o.value === v) ? (v as SetId) : 'a-j';
}

/* ── Targets ──────────────────────────────────────────────────────────────── */

interface TargetCell {
  dots: Dots;
  /** What the learner writes: "b", or "dot 4". */
  name: string;
  /** Skill-memory key, when there is one ("letter:b"). */
  key: string | null;
}
interface Target {
  kind: 'dot' | 'letter' | 'word';
  print: string;
  cells: TargetCell[];
}

const LETTER_SETS: Record<'a-j' | 'k-t' | 'u-z' | 'a-z', string[]> = {
  'a-j': ALPHABET.slice(0, 10),
  'k-t': ALPHABET.slice(10, 20),
  'u-z': ALPHABET.slice(20),
  'a-z': ALPHABET,
};

/** 3–4 letter words from the Word Decoder alphabet levels. */
const SHORT_WORDS = Array.from(
  new Set(
    WORD_DECODER_LEVELS.filter((l) => ['a-j', 'a-t', 'a-z'].includes(l.id))
      .flatMap((l) => l.items.map((i) => i.text.toLowerCase()))
      .filter((w) => /^[a-z]{3,4}$/.test(w)),
  ),
);

function letterTarget(l: string): Target {
  return { kind: 'letter', print: l, cells: [{ dots: LETTERS[l], name: l, key: `letter:${l}` }] };
}

function targetsFor(set: SetId): Target[] {
  if (set === 'dots') {
    // A single raised dot is, by definition, "dot n".
    return [1, 2, 3, 4, 5, 6].map((n) => ({
      kind: 'dot',
      print: `dot ${n}`,
      cells: [{ dots: [n], name: `dot ${n}`, key: null }],
    }));
  }
  if (set === 'words') {
    return SHORT_WORDS.map((w) => ({
      kind: 'word',
      print: w,
      cells: transcribe(w).map((c) => ({ dots: c.dots, name: c.label, key: `letter:${c.label}` })),
    }));
  }
  return LETTER_SETS[set].map(letterTarget);
}

/** Shuffled passes through the pool, never the same target twice in a row. */
function buildQueue(pool: Target[], n: number, after?: Target): Target[] {
  const out: Target[] = [];
  while (out.length < n) {
    const batch = shuffle(pool);
    const prev = out.length ? out[out.length - 1] : after;
    if (batch.length > 1 && prev && batch[0].print === prev.print) batch.push(batch.shift()!);
    out.push(...batch);
  }
  return out.slice(0, n);
}

type Marks = Partial<Record<number, 'correct' | 'missing' | 'extra'>>;

function diffMarks(value: readonly number[], target: Dots): Marks {
  const marks: Marks = {};
  for (let d = 1; d <= 6; d++) {
    const on = value.includes(d);
    const want = target.includes(d);
    if (on && want) marks[d] = 'correct';
    else if (on) marks[d] = 'extra';
    else if (want) marks[d] = 'missing';
  }
  return marks;
}

/** "Raise dot 2. Lower dot 4." — the fix, in words. */
function fixInWords(value: readonly number[], target: Dots): string {
  const missing = target.filter((d) => !value.includes(d));
  const extra = value.filter((d) => !target.includes(d));
  const parts: string[] = [];
  if (missing.length) parts.push(`Raise ${describe(missing)}.`);
  if (extra.length) parts.push(`Lower ${describe(extra)}.`);
  return parts.length ? parts.join(' ') : 'That’s it — press Check.';
}

/** "b is dots 1 2", or just "dot 4" for the single-dot set. */
function answerInWords(target: Target, cell: TargetCell): string {
  return target.kind === 'dot' ? `Just ${cell.name}` : `${cell.name} is ${describe(cell.dots)}`;
}

function promptFor(target: Target, cellIndex: number): string {
  if (target.kind === 'dot') return `Raise ${target.print}`;
  if (target.kind === 'letter') return `Write the letter ${target.print}`;
  return `Write the word ${target.print}, cell ${cellIndex + 1} of ${target.cells.length}: ${target.cells[cellIndex].name}`;
}

function starsFor(pace: Pace, firstTry: number, built: number): number {
  const acc = built ? firstTry / built : 0;
  if (pace === 'timed') {
    if (built >= 20 && acc >= 0.9) return 3;
    if (built >= TIMED_WIN && acc >= 0.7) return 2;
    return 1;
  }
  return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
}

/** Decorative celebration dots at fixed positions (no randomness during render). */
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2 + 0.26;
  const dist = i % 2 ? 5 : 7.5;
  return {
    '--x': `${(Math.cos(angle) * dist).toFixed(2)}rem`,
    '--y': `${(Math.sin(angle) * dist).toFixed(2)}rem`,
  } as CSSProperties;
});

/* ── Component ────────────────────────────────────────────────────────────── */

interface Round {
  pace: Pace;
  setId: SetId;
  pool: Target[];
  queue: Target[];
  /** Target index, and cell index within the target. */
  t: number;
  c: number;
  value: number[];
  misses: number;
  showMe: boolean;
  /** Cells finished, and how many of those were right first time. */
  built: number;
  firstTry: number;
  targetsDone: number;
  needHelp: string[];
  prevBest: number;
}

interface Outcome {
  pace: Pace;
  setId: SetId;
  built: number;
  firstTry: number;
  targetsDone: number;
  won: boolean;
  stars: number;
  score: number;
  prevBest: number;
  needHelp: string[];
}

type Phase = 'start' | 'play' | 'done';

export default function DotBuilder() {
  const params = useSearchParams();
  const setParam = params?.get('set') ?? null;

  const [setId, setSetId] = useState<SetId>(() => parseSet(setParam));
  const [pace, setPace] = useState<Pace>('relaxed');
  const [phase, setPhase] = useState<Phase>('start');
  const [round, setRound] = useState<Round | null>(null);
  const [flashMarks, setFlashMarks] = useState<Marks | undefined>(undefined);
  const [feedback, setFeedback] = useState<{ tone: 'good' | 'bad' | 'info'; text: string; dots?: Dots } | null>(null);
  const [burst, setBurst] = useState(0);
  const [msLeft, setMsLeft] = useState(TIMED_SECONDS * 1000);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const { announce, region } = useAnnouncer();
  const { stats, answer, finish } = useSession('dot-builder');

  const roundRef = useRef<Round | null>(null);
  const ended = useRef(false);
  const markTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clock = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const warned = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef(false);

  const commit = (r: Round | null) => {
    roundRef.current = r;
    setRound(r);
  };

  const stopTimers = useCallback(() => {
    clearTimeout(markTimer.current);
    clearInterval(clock.current);
    markTimer.current = undefined;
    clock.current = undefined;
  }, []);

  useEffect(() => stopTimers, [stopTimers]);

  // Follow the URL (results links can point back here with a new ?set=).
  useEffect(() => {
    stopTimers();
    setSetId(parseSet(setParam));
    roundRef.current = null;
    setRound(null);
    setOutcome(null);
    setFeedback(null);
    setPhase('start');
  }, [setParam, stopTimers]);

  // Keep keyboard focus on the pad when the control that had it goes away.
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    padRef.current?.querySelector<HTMLButtonElement>('.dotpad-dot')?.focus();
  });

  const say = useCallback(
    (tone: 'good' | 'bad' | 'info', text: string, dots?: Dots) => {
      announce(text);
      setFeedback({ tone, text, dots });
    },
    [announce],
  );

  const endRound = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    stopTimers();
    const r = roundRef.current;
    if (!r) return;
    const acc = r.built ? r.firstTry / r.built : 0;
    const won = r.pace === 'timed' ? r.built >= TIMED_WIN : acc >= 0.7;
    const score = r.pace === 'timed' ? r.built : r.firstTry;
    finish(won, score);
    setOutcome({
      pace: r.pace,
      setId: r.setId,
      built: r.built,
      firstTry: r.firstTry,
      targetsDone: r.targetsDone,
      won,
      stars: starsFor(r.pace, r.firstTry, r.built),
      score,
      prevBest: r.prevBest,
      needHelp: r.needHelp,
    });
    setFeedback(null);
    setFlashMarks(undefined);
    setPhase('done');
  }, [finish, stopTimers]);

  const onChange = useCallback((dots: number[]) => {
    const r = roundRef.current;
    if (!r || ended.current) return;
    clearTimeout(markTimer.current);
    setFlashMarks(undefined);
    commit({ ...r, value: dots });
  }, []);

  const check = useCallback(() => {
    const r = roundRef.current;
    if (!r || ended.current) return;
    const target = r.queue[r.t];
    const cell = target.cells[r.c];

    if (r.value.length === 0) {
      say('info', 'Raise at least one dot first — tap a dot, or press 1 to 6.');
      return;
    }

    const right = sameDots(r.value, cell.dots);
    // Skill memory counts the first attempt at each cell.
    if (r.misses === 0 && cell.key) answer(cell.key, right);

    if (!right) {
      const misses = r.misses + 1;
      const raised = describe(r.value);
      let text =
        target.kind === 'dot'
          ? `Almost! You raised ${raised}. Raise only ${cell.name}.`
          : `Almost! You raised ${raised}. ${cell.name} is ${describe(cell.dots)}.`;
      if (r.pace === 'relaxed' && misses >= 2 && !r.showMe) text += ' Need a hand? Choose “Show me”.';
      say('bad', text);
      clearTimeout(markTimer.current);
      setFlashMarks(diffMarks(r.value, cell.dots));
      markTimer.current = setTimeout(() => setFlashMarks(undefined), MARK_MS);
      commit({ ...r, misses });
      return;
    }

    // Correct.
    const first = r.misses === 0;
    const lastCell = r.c + 1 >= target.cells.length;
    let next: Round = {
      ...r,
      value: [],
      misses: 0,
      showMe: false,
      built: r.built + 1,
      firstTry: r.firstTry + (first ? 1 : 0),
      needHelp: first || r.needHelp.includes(cell.name) ? r.needHelp : [...r.needHelp, cell.name],
    };
    let text = target.kind === 'dot' ? `Yes! That’s ${cell.name}.` : `Yes! ${cell.name} is ${describe(cell.dots)}.`;
    if (lastCell && target.kind === 'word') text += ` You wrote “${target.print}”!`;

    clearTimeout(markTimer.current);
    setFlashMarks(undefined);
    setBurst((b) => b + 1);

    const active = document.activeElement;
    if (!active || active === document.body) pendingFocus.current = true;

    if (lastCell) {
      const t = r.t + 1;
      next = { ...next, targetsDone: r.targetsDone + 1 };
      if (r.pace === 'relaxed' && t >= ROUND) {
        commit(next);
        say('good', `${text} That’s the round!`, cell.dots);
        endRound();
        return;
      }
      const queue = t < r.queue.length ? r.queue : [...r.queue, ...buildQueue(r.pool, 30, r.queue[r.queue.length - 1])];
      next = { ...next, queue, t, c: 0 };
    } else {
      next = { ...next, c: r.c + 1 };
    }
    commit(next);
    say('good', `${text} Next: ${promptFor(next.queue[next.t], next.c)}.`, cell.dots);
  }, [answer, endRound, say]);

  const showMe = useCallback(() => {
    const r = roundRef.current;
    if (!r || ended.current || r.pace !== 'relaxed' || r.misses < 2 || r.showMe) return;
    const target = r.queue[r.t];
    const cell = target.cells[r.c];
    clearTimeout(markTimer.current);
    setFlashMarks(undefined);
    commit({ ...r, showMe: true });
    say('info', `${answerInWords(target, cell)}. ${fixInWords(r.value, cell.dots)}`);
    pendingFocus.current = true;
  }, [say]);

  const clear = useCallback(() => onChange([]), [onChange]);

  const start = useCallback(() => {
    stopTimers();
    const pool = targetsFor(setId);
    const queue = buildQueue(pool, pace === 'timed' ? 60 : ROUND);
    ended.current = false;
    warned.current = false;
    commit({
      pace,
      setId,
      pool,
      queue,
      t: 0,
      c: 0,
      value: [],
      misses: 0,
      showMe: false,
      built: 0,
      firstTry: 0,
      targetsDone: 0,
      needHelp: [],
      prevBest: stats.bestScore,
    });
    setFlashMarks(undefined);
    setOutcome(null);
    setBurst(0);
    setPhase('play');
    pendingFocus.current = true;
    const first = `${promptFor(queue[0], 0)}. Press dot keys 1 to 6, then Enter to check.`;
    setFeedback(null);

    if (pace === 'timed') {
      const endAt = Date.now() + TIMED_SECONDS * 1000;
      setMsLeft(TIMED_SECONDS * 1000);
      clock.current = setInterval(() => {
        const left = Math.max(0, endAt - Date.now());
        setMsLeft(left);
        if (left <= 10_000 && !warned.current) {
          warned.current = true;
          announce('10 seconds left!');
        }
        if (left <= 0) endRound();
      }, 250);
      announce(`Go! 90 seconds. ${first}`);
    } else {
      announce(first);
    }
  }, [announce, endRound, pace, setId, stats.bestScore, stopTimers]);

  // Enter starts; H asks for help. (DotPad handles 1–6, F D S J K L, Enter and Backspace while playing.)
  useGameKeys(
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t !== document.body) {
        const tag = t.tagName;
        if (tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return;
        if (tag === 'INPUT' && !((t as HTMLInputElement).type === 'radio' && boardRef.current?.contains(t))) return;
      }
      if (phase === 'start' && e.key === 'Enter') {
        if (t && (t.tagName === 'BUTTON' || t.tagName === 'A')) return;
        e.preventDefault();
        start();
      } else if (phase === 'play' && (e.key === 'h' || e.key === 'H' || e.key === '?')) {
        e.preventDefault();
        showMe();
      }
    },
    { allowInInputs: true },
  );

  /* ── Render ─────────────────────────────────────────────────────────────── */

  let body: ReactNode = null;

  if (phase === 'start') {
    body = (
      <StartPanel
        heading="Let’s build some braille!"
        onStart={start}
        startLabel={pace === 'timed' ? 'Start the clock' : 'Start'}
      >
        <p className="db-intro">
          You’ll see a letter or a word. Raise the right dots to write it — tap the dots, or press <kbd>1</kbd>–
          <kbd>6</kbd> (or <kbd>F</kbd> <kbd>D</kbd> <kbd>S</kbd> <kbd>J</kbd> <kbd>K</kbd> <kbd>L</kbd>), then{' '}
          <kbd>Enter</kbd> to check.
        </p>
        <div className="db-options">
          <ModePicker
            legend="What to build"
            name="dot-builder-set"
            value={setId}
            options={SET_OPTIONS}
            onChange={setSetId}
          />
          <ModePicker legend="Pace" name="dot-builder-pace" value={pace} options={PACE_OPTIONS} onChange={setPace} />
        </div>
        <p className="db-start-hint">
          Press <kbd>Enter</kbd> to start.
        </p>
      </StartPanel>
    );
  } else if (phase === 'play' && round) {
    const target = round.queue[round.t];
    const cell = target.cells[round.c];
    const timed = round.pace === 'timed';
    const secs = Math.ceil(msLeft / 1000);
    const hud: HudItem[] = timed
      ? [
          { label: 'Time', value: `${secs}s`, tone: secs <= 10 ? 'warn' : 'timer' },
          { label: 'Built', value: round.built },
        ]
      : [
          { label: target.kind === 'word' ? 'Word' : 'Target', value: `${round.t + 1} / ${ROUND}` },
          { label: 'First try', value: round.firstTry },
        ];
    const marks = round.showMe ? diffMarks(round.value, cell.dots) : flashMarks;
    const canShowMe = !timed && round.misses >= 2 && !round.showMe;

    body = (
      <>
        <div className="game-board-toolbar">
          <Hud items={hud} />
        </div>
        {timed && (
          <div className={`timer-bar${secs <= 10 ? ' is-low' : ''}`} aria-hidden="true">
            <span style={{ width: `${(msLeft / (TIMED_SECONDS * 1000)) * 100}%` }} />
          </div>
        )}

        <div className="db-layout">
          <div className="db-target" data-testid="target">
            {target.kind === 'word' ? (
              <>
                <h2 className="db-prompt">
                  Write the word <span className="sr-only">{target.print}</span>
                </h2>
                <ol className="db-word" aria-hidden="true">
                  {target.cells.map((tc, i) => (
                    <li
                      key={i}
                      className={`db-word-letter${i < round.c ? ' is-done' : ''}${i === round.c ? ' is-current' : ''}`}
                    >
                      <span className="db-word-print">{tc.name}</span>
                      <Cell dots={i < round.c ? tc.dots : []} size="sm" flat="ghost" pop={i < round.c} />
                    </li>
                  ))}
                </ol>
                <p className="db-progress">
                  Cell {round.c + 1} of {target.cells.length}
                  <span className="sr-only">: {cell.name}</span>
                </p>
              </>
            ) : (
              <h2 className="db-prompt">
                <span className="db-prompt-lead">{target.kind === 'dot' ? 'Raise' : 'Write the letter'}</span>{' '}
                <span className={`big-print db-print${target.kind === 'dot' ? ' db-print--dot' : ''}`}>
                  {target.print}
                </span>
              </h2>
            )}
          </div>

          <div className="db-pad-stage">
            <div ref={padRef} className="db-pad" data-current={cell.name}>
              <DotPad
                value={round.value}
                onChange={onChange}
                onSubmit={check}
                marks={marks}
                label={`Writing pad for ${cell.name}`}
              />
            </div>
            {burst > 0 && (
              <div key={burst} className="burst" aria-hidden="true">
                {BURST.map((style, i) => (
                  <span key={i} style={style} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="cluster db-actions">
          <button type="button" className="btn btn--pine btn--lg" onClick={check}>
            Check
          </button>
          <button type="button" className="btn btn--paper" onClick={clear}>
            Clear
          </button>
          {canShowMe && (
            <button type="button" className="btn btn--marigold" onClick={showMe}>
              Show me
            </button>
          )}
        </div>

        {round.showMe && (
          <p className="db-hint" aria-hidden="true">
            <Cell dots={cell.dots} size="sm" tone="pine" />
            <span>
              {answerInWords(target, cell)}. {fixInWords(round.value, cell.dots)}
            </span>
          </p>
        )}

        <p className={`feedback${feedback ? ` feedback--${feedback.tone}` : ''}`} aria-hidden="true">
          {feedback && (
            <span className="feedback-pill">
              {feedback.dots && <Cell dots={feedback.dots} size="xs" tone="pine" />}
              {feedback.text}
            </span>
          )}
        </p>
      </>
    );
  } else if (phase === 'done' && outcome) {
    const { pace: p, built, firstTry, targetsDone, needHelp } = outcome;
    const best = Math.max(outcome.prevBest, outcome.score);
    const title = outcome.won ? (outcome.stars === 3 ? 'Master builder!' : 'Nicely built!') : 'Good practice!';
    const what = outcome.setId === 'words' ? `${targetsDone} ${targetsDone === 1 ? 'word' : 'words'}, ` : '';
    const summary =
      p === 'timed'
        ? `You built ${what}${built} ${built === 1 ? 'cell' : 'cells'} in ${TIMED_SECONDS} seconds.`
        : `${what}${firstTry} of ${built} cells right on the first try.`;
    body = (
      <Results
        title={title}
        summary={summary}
        stars={outcome.stars}
        best={p === 'timed' ? `${best} cells` : `${best} first try`}
        isNewBest={outcome.score > outcome.prevBest}
        onReplay={start}
        next={NEXT[outcome.setId]}
      >
        {needHelp.length > 0 ? (
          <div className="db-review">
            <p className="db-review-title">These took a few tries — worth another go:</p>
            <ul className="db-review-list">
              {needHelp.map((name) => {
                const dots = name in LETTERS ? LETTERS[name] : [Number(name.replace('dot ', ''))];
                return (
                  <li key={name} className="db-review-item">
                    <Cell dots={dots} size="sm" />
                    <span className="db-review-name">{name}</span>
                    {name in LETTERS && <span className="db-review-dots">{describe(dots)}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="db-perfect">Every cell right on the first try. Your fingers know the way!</p>
        )}
      </Results>
    );
  }

  return (
    <div className="game-board db-board" data-testid="game-board" ref={boardRef}>
      {region}
      {body}
    </div>
  );
}
