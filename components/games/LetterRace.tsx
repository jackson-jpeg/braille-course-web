'use client';

import '@/styles/games/letter-race.css';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Cell from '@/components/ui/Cell';
import { ALPHABET, LETTERS, describe } from '@/lib/ueb';
import {
  Choices,
  Hud,
  ModePicker,
  Results,
  StartPanel,
  useAnnouncer,
  useGameKeys,
  useSession,
  shuffle,
  pickDistractors,
  dotSimilarity,
  type HudItem,
} from '@/components/games/kit';

/* ── Settings ─────────────────────────────────────────────────────────────── */

type SetId = 'a-j' | 'k-t' | 'u-z' | 'a-z';
type Pace = 'relaxed' | 'race';

const SETS: Record<SetId, { label: string; hint: string; letters: string[] }> = {
  'a-j': { label: 'a–j', hint: 'The first ten', letters: ALPHABET.slice(0, 10) },
  'k-t': { label: 'k–t', hint: 'a–j plus dot 3', letters: ALPHABET.slice(10, 20) },
  'u-z': { label: 'u–z', hint: 'The last six', letters: ALPHABET.slice(20) },
  'a-z': { label: 'All letters', hint: 'a to z', letters: ALPHABET },
};
const SET_OPTIONS = (Object.keys(SETS) as SetId[]).map((value) => ({
  value,
  label: SETS[value].label,
  hint: SETS[value].hint,
}));
const PACE_OPTIONS: { value: Pace; label: string; hint: string }[] = [
  { value: 'relaxed', label: 'Relaxed', hint: 'No timer, 10 cells' },
  { value: 'race', label: 'Race', hint: '60 seconds on the clock' },
];
const NEXT: Record<SetId, { href: string; label: string }> = {
  'a-j': { href: '/games/letter-race?set=k-t', label: 'Next: letters k–t' },
  'k-t': { href: '/games/letter-race?set=u-z', label: 'Next: letters u–z' },
  'u-z': { href: '/games/letter-race?set=a-z', label: 'Next: all 26 letters' },
  'a-z': { href: '/games/word-decoder', label: 'Next: read real words' },
};

const ROUND = 10;
const RACE_SECONDS = 60;
/** A race counts as a win at this many correct answers. */
const RACE_WIN = 10;
const DELAY = {
  relaxed: { right: 900, wrong: 1600 },
  race: { right: 600, wrong: 1300 },
} as const;

function parseSet(v: string | null): SetId {
  return v && v in SETS ? (v as SetId) : 'a-j';
}

/** "?letters=qrw" (or "q,r,w") → ['q', 'r', 'w'], ignoring anything that isn't a letter. */
function parseLetters(v: string | null): string[] {
  if (!v) return [];
  return Array.from(new Set(v.toLowerCase().split(''))).filter((c) => c in LETTERS);
}

/* ── Questions ────────────────────────────────────────────────────────────── */

interface Question {
  letter: string;
  choices: string[];
}

const letterSimilarity = (a: string, b: string) => dotSimilarity(LETTERS[a], LETTERS[b]);

function makeQuestion(letter: string, distractorPool: string[]): Question {
  const wrong = pickDistractors(letter, distractorPool, 3, letterSimilarity);
  return { letter, choices: shuffle([letter, ...wrong]) };
}

/** Shuffled passes through the pool, never showing the same letter twice in a row. */
function buildQueue(pool: string[], n: number, after?: string): string[] {
  const out: string[] = [];
  while (out.length < n) {
    const batch = shuffle(pool);
    const prev = out.length ? out[out.length - 1] : after;
    if (batch.length > 1 && batch[0] === prev) batch.push(batch.shift()!);
    out.push(...batch);
  }
  return out.slice(0, n);
}

function starsFor(pace: Pace, correct: number, answered: number): number {
  const acc = answered ? correct / answered : 0;
  if (pace === 'race') {
    if (correct >= 20 && acc >= 0.9) return 3;
    if (correct >= RACE_WIN && acc >= 0.7) return 2;
    return 1;
  }
  return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
}

/** Decorative celebration dots, fixed positions (no randomness during render). */
const BURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
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
  review: string[];
  pool: string[];
  distractorPool: string[];
  queue: string[];
  index: number;
  question: Question;
  picked: string | null;
  correct: number;
  answered: number;
  streak: number;
  missed: string[];
  prevBest: number;
}

interface Outcome {
  pace: Pace;
  setId: SetId;
  review: string[];
  correct: number;
  answered: number;
  won: boolean;
  stars: number;
  prevBest: number;
  missed: string[];
}

type Phase = 'start' | 'play' | 'done';

export default function LetterRace() {
  const params = useSearchParams();
  const setParam = params?.get('set') ?? null;
  const lettersParam = params?.get('letters') ?? null;

  const [setId, setSetId] = useState<SetId>(() => parseSet(setParam));
  const [review, setReview] = useState<string[]>(() => parseLetters(lettersParam));
  const [pace, setPace] = useState<Pace>('relaxed');
  const [phase, setPhase] = useState<Phase>('start');
  const [round, setRound] = useState<Round | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const [msLeft, setMsLeft] = useState(RACE_SECONDS * 1000);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const { announce, region } = useAnnouncer();
  const { stats, answer, finish } = useSession('letter-race');

  // Live copy of the round so key handlers never act on a stale render.
  const roundRef = useRef<Round | null>(null);
  const ended = useRef(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clock = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const warned = useRef(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const choicesRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<'stage' | 'next' | null>(null);

  const commit = (r: Round | null) => {
    roundRef.current = r;
    setRound(r);
  };

  const stopTimers = useCallback(() => {
    clearTimeout(advanceTimer.current);
    clearInterval(clock.current);
    advanceTimer.current = undefined;
    clock.current = undefined;
  }, []);

  useEffect(() => stopTimers, [stopTimers]);

  // Follow the URL (the results screen links back here with a new ?set=).
  useEffect(() => {
    stopTimers();
    setSetId(parseSet(setParam));
    setReview(parseLetters(lettersParam));
    roundRef.current = null;
    setRound(null);
    setOutcome(null);
    setFeedback(null);
    setPhase('start');
  }, [setParam, lettersParam, stopTimers]);

  // Move focus only when the focused control is about to vanish or be disabled.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    (target === 'next' ? nextRef.current : stageRef.current)?.focus();
  });

  const endRound = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    stopTimers();
    const r = roundRef.current;
    if (!r) return;
    const acc = r.answered ? r.correct / r.answered : 0;
    const won = r.pace === 'race' ? r.correct >= RACE_WIN : acc >= 0.7;
    finish(won, r.correct);
    setOutcome({
      pace: r.pace,
      setId: r.setId,
      review: r.review,
      correct: r.correct,
      answered: r.answered,
      won,
      stars: starsFor(r.pace, r.correct, r.answered),
      prevBest: r.prevBest,
      missed: r.missed,
    });
    setFeedback(null);
    setPhase('done');
  }, [finish, stopTimers]);

  const advance = useCallback(() => {
    clearTimeout(advanceTimer.current);
    const r = roundRef.current;
    if (!r || ended.current || !r.picked) return;
    const index = r.index + 1;
    if (r.pace === 'relaxed' && index >= ROUND) {
      endRound();
      return;
    }
    const queue =
      index < r.queue.length ? r.queue : [...r.queue, ...buildQueue(r.pool, 50, r.queue[r.queue.length - 1])];
    const active = document.activeElement;
    if (
      !active ||
      active === document.body ||
      active === nextRef.current ||
      stageRef.current?.contains(active) ||
      choicesRef.current?.contains(active)
    ) {
      pendingFocus.current = 'stage';
    }
    setFeedback(null);
    commit({ ...r, queue, index, question: makeQuestion(queue[index], r.distractorPool), picked: null });
  }, [endRound]);

  const onPick = useCallback(
    (id: string) => {
      const r = roundRef.current;
      if (!r || r.picked || ended.current) return;
      const { letter } = r.question;
      const right = id === letter;
      answer(`letter:${letter}`, right);

      const dots = describe(LETTERS[letter]);
      const text = right
        ? `Correct! That's ${letter}, ${dots}.`
        : `Not quite — that cell is ${letter}, ${dots}. You chose ${id}.`;
      announce(text);
      setFeedback({ tone: right ? 'good' : 'bad', text });

      if (choicesRef.current?.contains(document.activeElement)) pendingFocus.current = right ? 'stage' : 'next';
      commit({
        ...r,
        picked: id,
        correct: r.correct + (right ? 1 : 0),
        answered: r.answered + 1,
        streak: right ? r.streak + 1 : 0,
        missed: right || r.missed.includes(letter) ? r.missed : [...r.missed, letter],
      });
      const delay = DELAY[r.pace][right ? 'right' : 'wrong'];
      advanceTimer.current = setTimeout(advance, delay);
    },
    [advance, announce, answer],
  );

  const start = useCallback(() => {
    stopTimers();
    const reviewing = review.length > 0;
    const pool = reviewing ? review : SETS[setId].letters;
    const distractorPool = reviewing ? ALPHABET : SETS[setId].letters;
    const queue = buildQueue(pool, pace === 'race' ? 120 : ROUND);
    ended.current = false;
    warned.current = false;
    commit({
      pace,
      setId,
      review,
      pool,
      distractorPool,
      queue,
      index: 0,
      question: makeQuestion(queue[0], distractorPool),
      picked: null,
      correct: 0,
      answered: 0,
      streak: 0,
      missed: [],
      prevBest: stats.bestScore,
    });
    setFeedback(null);
    setOutcome(null);
    setPhase('play');
    pendingFocus.current = 'stage';

    if (pace === 'race') {
      const endAt = Date.now() + RACE_SECONDS * 1000;
      setMsLeft(RACE_SECONDS * 1000);
      clock.current = setInterval(() => {
        const left = Math.max(0, endAt - Date.now());
        setMsLeft(left);
        if (left <= 10_000 && !warned.current) {
          warned.current = true;
          announce('10 seconds left!');
        }
        if (left <= 0) endRound();
      }, 250);
      announce('Go! You have 60 seconds. Press 1 to 4, or type the letter.');
    } else {
      announce('Here we go — 10 cells, no timer. Press 1 to 4, or type the letter.');
    }
  }, [announce, endRound, pace, review, setId, stats.bestScore, stopTimers]);

  // Enter starts a round, and skips ahead after an answer.
  useGameKeys(
    (e) => {
      if (e.key !== 'Enter') return;
      const t = e.target as HTMLElement | null;
      if (t && t !== document.body) {
        const tag = t.tagName;
        if (tag === 'BUTTON' || tag === 'A' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return;
        if (tag === 'INPUT' && !((t as HTMLInputElement).type === 'radio' && boardRef.current?.contains(t))) return;
      }
      if (phase === 'start') {
        e.preventDefault();
        start();
      } else if (phase === 'play' && roundRef.current?.picked) {
        e.preventDefault();
        advance();
      }
    },
    { allowInInputs: true },
  );

  /* ── Render ─────────────────────────────────────────────────────────────── */

  const reviewChip = (letters: string[]) => (
    <span className="chip chip--marigold lr-review-chip">Reviewing: {letters.join(', ')}</span>
  );

  let body: ReactNode = null;

  if (phase === 'start') {
    body = (
      <StartPanel heading="Ready, set, read!" onStart={start} startLabel={pace === 'race' ? 'Start the race' : 'Start'}>
        <p className="lr-intro">
          A braille cell pops up. Pick its letter — tap an answer, press <kbd>1</kbd>–<kbd>4</kbd>, or just type the
          letter.
        </p>
        <div className="lr-options">
          {review.length > 0 ? (
            <div className="lr-review">
              {reviewChip(review)}
              <button type="button" className="btn btn--paper btn--sm" onClick={() => setReview([])}>
                Choose a letter set instead
              </button>
            </div>
          ) : (
            <ModePicker
              legend="Letters"
              name="letter-race-set"
              value={setId}
              options={SET_OPTIONS}
              onChange={setSetId}
            />
          )}
          <ModePicker legend="Pace" name="letter-race-pace" value={pace} options={PACE_OPTIONS} onChange={setPace} />
        </div>
        <p className="lr-start-hint">
          Press <kbd>Enter</kbd> to start.
        </p>
      </StartPanel>
    );
  } else if (phase === 'play' && round) {
    const { question, picked, index } = round;
    const right = picked != null && picked === question.letter;
    const race = round.pace === 'race';
    const secs = Math.ceil(msLeft / 1000);
    const hud: HudItem[] = race
      ? [
          { label: 'Time', value: `${secs}s`, tone: secs <= 10 ? 'warn' : 'timer' },
          { label: 'Score', value: round.correct },
          { label: 'Streak', value: round.streak, tone: 'streak' },
        ]
      : [
          { label: 'Cell', value: `${Math.min(index + 1, ROUND)} / ${ROUND}` },
          { label: 'Right', value: round.correct },
          { label: 'Streak', value: round.streak, tone: 'streak' },
        ];

    body = (
      <>
        <div className="game-board-toolbar">
          <Hud items={hud} />
          {round.review.length > 0 && reviewChip(round.review)}
        </div>
        {race && (
          <div className={`timer-bar${secs <= 10 ? ' is-low' : ''}`} aria-hidden="true">
            <span style={{ width: `${(msLeft / (RACE_SECONDS * 1000)) * 100}%` }} />
          </div>
        )}
        <h2 className="game-prompt lr-prompt">Which letter is this?</h2>
        <div
          key={index}
          ref={stageRef}
          tabIndex={-1}
          role="group"
          aria-label={race ? `Cell ${index + 1}` : `Cell ${index + 1} of ${ROUND}`}
          className={`game-cell-stage lr-stage${picked ? (right ? ' is-right' : ' is-wrong') : ''}`}
        >
          <Cell dots={LETTERS[question.letter]} size="xl" framed pop label="Mystery cell" />
          <span className={`lr-reveal${picked ? ' is-shown' : ''}`} aria-hidden="true">
            {picked ? question.letter : ''}
          </span>
          {right && (
            <div className="burst" aria-hidden="true">
              {BURST.map((style, i) => (
                <span key={i} style={style} />
              ))}
            </div>
          )}
        </div>
        <div ref={choicesRef}>
          <Choices
            choices={question.choices.map((l) => ({
              id: l,
              content: <span className="lr-choice">{l}</span>,
              label: l,
            }))}
            onPick={onPick}
            correctId={picked ? question.letter : null}
            pickedId={picked}
            disabled={picked != null}
            typeToPick
            label="Which letter is it?"
          />
        </div>
        <div className="lr-after">
          <p className={`feedback${feedback ? ` feedback--${feedback.tone}` : ''}`} aria-hidden="true">
            {feedback && <span className="feedback-pill">{feedback.text}</span>}
          </p>
          {picked != null && !right && (
            <button ref={nextRef} type="button" className="btn btn--pine lr-next" onClick={advance}>
              Next cell
            </button>
          )}
        </div>
      </>
    );
  } else if (phase === 'done' && outcome) {
    const { correct, answered, pace: p, review: rev, missed } = outcome;
    const best = Math.max(outcome.prevBest, correct);
    const title = outcome.won ? (outcome.stars === 3 ? 'Wonderful reading!' : 'Nicely done!') : 'Good practice!';
    const summary =
      p === 'race'
        ? `You read ${correct} ${correct === 1 ? 'cell' : 'cells'} correctly in ${RACE_SECONDS} seconds (${answered} tried).`
        : `${correct} of ${answered} correct.`;
    const next = rev.length > 0 ? NEXT['u-z'] : NEXT[outcome.setId];
    body = (
      <Results
        title={title}
        summary={summary}
        stars={outcome.stars}
        best={`${best} correct`}
        isNewBest={correct > outcome.prevBest}
        onReplay={start}
        next={next}
      >
        {missed.length > 0 ? (
          <div className="lr-missed">
            <p className="lr-missed-title">Worth another look:</p>
            <ul className="lr-missed-list">
              {missed.map((l) => (
                <li key={l} className="lr-missed-item">
                  <Cell dots={LETTERS[l]} size="sm" />
                  <span className="lr-missed-letter">{l}</span>
                  <span className="lr-missed-dots">{describe(LETTERS[l])}</span>
                </li>
              ))}
            </ul>
            <Link className="lr-missed-link" href={`/games/letter-race?letters=${missed.join('')}`}>
              Practise just these letters
            </Link>
          </div>
        ) : (
          <p className="lr-perfect">Every cell read correctly. Your fingers and eyes are learning fast!</p>
        )}
      </Results>
    );
  }

  return (
    <div className="game-board lr-board" data-testid="game-board" ref={boardRef}>
      {region}
      {body}
    </div>
  );
}
