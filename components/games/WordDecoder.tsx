'use client';

import '@/styles/games/word-decoder.css';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cell from '@/components/ui/Cell';
import { Hud, Results, StartPanel, shuffle, useAnnouncer, useGameKeys, useSession } from '@/components/games/kit';
import { WORD_DECODER_LEVELS, type DecoderItem, type DecoderLevel } from '@/lib/games/word-decoder-content';
import { describe, PUNCTUATION, transcribe, type Cell as UebCell } from '@/lib/ueb';
import { itemStrength } from '@/lib/progress-storage';

const ROUND_SIZE = 8;
const WIN_AT = 6;
const BASE_POINTS = 10;
const HINT_COST = 2;
/** Levels where capital letters are part of the answer. */
const CASE_SENSITIVE = new Set(['capitals', 'sentences']);

type Phase = 'start' | 'play' | 'results';
/** asking → (wrong once) retry → done */
type Status = 'asking' | 'retry' | 'done';

interface ItemResult {
  text: string;
  correct: boolean;
  points: number;
  hints: number;
}

/* ── Pure helpers (exported for tests) ─────────────────────────────────────── */

export function getLevel(id: string | null | undefined): DecoderLevel | undefined {
  return WORD_DECODER_LEVELS.find((l) => l.id === id);
}

function normalize(s: string, caseSensitive: boolean): string {
  const t = s.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  return caseSensitive ? t : t.toLowerCase();
}

/** Does the typed answer match the print? */
export function isMatch(guess: string, answer: string, levelId: string): boolean {
  const cs = CASE_SENSITIVE.has(levelId);
  return normalize(guess, cs) === normalize(answer, cs);
}

/** A screen-reader description of the braille that never gives away the print. */
export function brailleLabel(cells: readonly UebCell[]): string {
  let n = 0;
  const parts = cells.map((c) => (c.dots.length === 0 ? 'space' : `cell ${++n}: ${describe(c.dots)}`));
  return `Braille to decode: ${parts.join('; ')}`;
}

const PRINT_BY_NAME = new Map(PUNCTUATION.map((p) => [p.name.toLowerCase(), p.print ?? '']));

/** Short visible caption under a cell: the letter or mark, or the indicator's name. */
function captionFor(cell: UebCell): string {
  if (cell.label.length === 1) return cell.label;
  return PRINT_BY_NAME.get(cell.label) || cell.label;
}

/** Spoken meaning of a cell for hints, e.g. "b", "capital sign", "period". */
function spokenFor(cell: UebCell): string {
  if (cell.label === 'capital') return 'the capital sign';
  if (cell.label === 'capital word') return 'part of the capital word sign';
  if (cell.label === 'number sign') return 'the number sign';
  if (cell.label === 'grade 1 indicator') return 'the grade 1 indicator';
  if (/^[A-Z]$/.test(cell.label)) return `capital ${cell.label}`;
  return cell.label;
}

function nextLevelId(id: string): string | null {
  const i = WORD_DECODER_LEVELS.findIndex((l) => l.id === id);
  return WORD_DECODER_LEVELS[i + 1]?.id ?? null;
}

function starsFor(correct: number, hints: number): number {
  if (correct === ROUND_SIZE && hints === 0) return 3;
  if (correct >= WIN_AT) return 2;
  if (correct >= 3) return 1;
  return 0;
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function WordDecoder() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramLevel = searchParams?.get('level') ?? null;
  const { answer, finish, stats } = useSession('word-decoder');
  const { announce, region } = useAnnouncer();

  const [levelId, setLevelId] = useState<string>(() => getLevel(paramLevel)?.id ?? WORD_DECODER_LEVELS[0].id);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('start');
  const [items, setItems] = useState<DecoderItem[]>([]);
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [status, setStatus] = useState<Status>('asking');
  const [revealed, setRevealed] = useState(0);
  const [feedback, setFeedback] = useState<{ tone: 'good' | 'bad' | 'info'; text: string } | null>(null);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [lastPoints, setLastPoints] = useState(0);
  const [bestBefore, setBestBefore] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const level = getLevel(levelId) ?? WORD_DECODER_LEVELS[0];
  const item = phase === 'play' ? items[index] : undefined;

  // A link to ?level=… (e.g. "Next level" on the results card) switches level and returns to the start.
  useEffect(() => {
    const fromUrl = getLevel(paramLevel);
    if (fromUrl) {
      setLevelId(fromUrl.id);
      setPhase('start');
    }
  }, [paramLevel]);

  // Recommend the first level not yet mastered (reads localStorage, so only after mount).
  useEffect(() => {
    if (phase !== 'start') return;
    const first = WORD_DECODER_LEVELS.find((l) => itemStrength(`word:${l.id}`) < 0.6);
    setRecommended(first?.id ?? null);
    if (!getLevel(paramLevel) && first) setLevelId(first.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const cells = useMemo(() => (item ? transcribe(item.text) : []), [item]);
  /** Positions of non-space cells, in reading order — the order hints reveal them. */
  const readable = useMemo(() => cells.map((c, i) => (c.dots.length ? i : -1)).filter((i) => i >= 0), [cells]);
  const revealedSet = useMemo(() => new Set(readable.slice(0, revealed)), [readable, revealed]);
  const allRevealed = readable.length > 0 && revealed >= readable.length;

  const totalPoints = results.reduce((s, r) => s + r.points, 0);
  const correctCount = results.filter((r) => r.correct).length;
  const hintsTotal = results.reduce((s, r) => s + r.hints, 0);

  const chooseLevel = (id: string) => {
    setLevelId(id);
    try {
      router.replace(`/games/word-decoder?level=${id}`, { scroll: false });
    } catch {
      /* navigation is a nicety */
    }
  };

  const start = useCallback(() => {
    setItems(shuffle(level.items).slice(0, ROUND_SIZE));
    setIndex(0);
    setGuess('');
    setStatus('asking');
    setRevealed(0);
    setFeedback(null);
    setResults([]);
    setLastPoints(0);
    setBestBefore(stats.bestScore);
    setPhase('play');
    announce(`${level.title}. Word 1 of ${Math.min(ROUND_SIZE, level.items.length)}.`);
  }, [level, announce, stats.bestScore]);

  // Focus the answer box for each new word; focus "Next" once a word is finished.
  useEffect(() => {
    if (phase !== 'play') return;
    if (status === 'done') nextRef.current?.focus();
    else if (status === 'asking') inputRef.current?.focus();
  }, [phase, index, status]);

  /** Record per-letter and per-digit memory for the first attempt (skipping cells shown by a hint). */
  const recordItems = (it: DecoderItem, typed: string, correct: boolean) => {
    answer(`word:${level.id}`, correct);
    const ans = it.text.replace(/[’‘]/g, "'");
    const g = typed.trim().replace(/[’‘]/g, "'");
    const samePositions = g.length === ans.length;
    // Which letters/digits (by order among letters and digits) did a hint reveal?
    const shownOrdinals = new Set<number>();
    let ord = 0;
    cells.forEach((c, i) => {
      if (c.label.length === 1 && /[A-Za-z0-9]/.test(c.label)) {
        if (revealedSet.has(i)) shownOrdinals.add(ord);
        ord++;
      }
    });
    const byKey = new Map<string, boolean>();
    ord = 0;
    for (let i = 0; i < ans.length; i++) {
      const ch = ans[i];
      if (!/[A-Za-z0-9]/.test(ch)) continue;
      const o = ord++;
      if (shownOrdinals.has(o)) continue;
      const key = /[0-9]/.test(ch) ? `digit:${ch}` : `letter:${ch.toLowerCase()}`;
      const ok = correct || (samePositions && g[i].toLowerCase() === ch.toLowerCase());
      byKey.set(key, (byKey.get(key) ?? true) && ok);
    }
    byKey.forEach((ok, key) => answer(key, ok));
  };

  const check = (e?: FormEvent) => {
    e?.preventDefault();
    if (!item || status === 'done') return;
    if (!guess.trim()) {
      setFeedback({ tone: 'info', text: 'Type what the braille says, then press Check.' });
      announce('Type what the braille says first.');
      return;
    }
    const correct = isMatch(guess, item.text, level.id);
    if (status === 'asking') recordItems(item, guess, correct);

    if (correct) {
      const base = allRevealed ? 0 : Math.max(0, BASE_POINTS - HINT_COST * revealed);
      const points = status === 'retry' ? Math.floor(base / 2) : base;
      setLastPoints(points);
      setResults((r) => [...r, { text: item.text, correct: true, points, hints: revealed }]);
      setStatus('done');
      const msg =
        status === 'retry'
          ? `Yes! It says “${item.text}”. You got it on the second try.`
          : `Yes! It says “${item.text}”.`;
      setFeedback({ tone: 'good', text: msg });
      announce(`${msg} ${points} points.`);
      return;
    }

    if (status === 'asking') {
      const caseOnly = isMatch(guess, item.text, 'a-z');
      const msg = caseOnly
        ? 'So close — check your capital letters, then try again.'
        : `Not quite. Have another go${allRevealed ? '' : ', or take a hint'}.${item.hint ? ` ${item.hint}` : ''}`;
      setStatus('retry');
      setFeedback({ tone: 'bad', text: msg });
      announce(msg);
      inputRef.current?.select();
      return;
    }

    // Second miss: show the answer, cell by cell.
    setLastPoints(0);
    setResults((r) => [...r, { text: item.text, correct: false, points: 0, hints: revealed }]);
    setStatus('done');
    setRevealed(readable.length);
    const msg = `Good try. It says “${item.text}”. Each cell’s meaning is shown under it.`;
    setFeedback({ tone: 'bad', text: msg });
    announce(msg);
  };

  const hint = () => {
    if (!item || status === 'done' || allRevealed) return;
    const pos = readable[revealed];
    const n = revealed + 1;
    setRevealed(n);
    const msg = `Hint: cell ${n} is ${spokenFor(cells[pos])}.`;
    setFeedback({ tone: 'info', text: msg });
    announce(msg);
    inputRef.current?.focus();
  };

  const next = useCallback(() => {
    if (phase !== 'play' || status !== 'done') return;
    if (index + 1 >= items.length) {
      const won = correctCount >= WIN_AT;
      finish(won, totalPoints);
      setPhase('results');
      return;
    }
    setIndex((i) => i + 1);
    setGuess('');
    setStatus('asking');
    setRevealed(0);
    setFeedback(null);
    announce(`Word ${index + 2} of ${items.length}.`);
  }, [phase, status, index, items.length, correctCount, totalPoints, finish, announce]);

  useGameKeys((e) => {
    const onButton = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
    if (onButton) return;
    if (phase === 'start' && e.key === 'Enter') {
      e.preventDefault();
      start();
    } else if (phase === 'play' && status === 'done' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      next();
    }
  });

  /* ── Start ── */
  if (phase === 'start') {
    return (
      <div className="game-board" data-testid="game-board">
        {region}
        <StartPanel heading="Read the braille, type the word" onStart={start} startLabel={`Start: ${level.title}`}>
          <p className="game-prompt-sub wd-intro">
            You’ll see {ROUND_SIZE} braille words or sentences. Type what each one says. Stuck? A hint shows one cell at
            a time.
          </p>
          <fieldset className="wd-levels">
            <legend>Choose a level</legend>
            <div className="wd-level-grid">
              {WORD_DECODER_LEVELS.map((l, i) => {
                const checked = l.id === levelId;
                return (
                  <label key={l.id} className={`wd-level${checked ? ' is-checked' : ''}`}>
                    <input
                      type="radio"
                      name="wd-level"
                      value={l.id}
                      checked={checked}
                      onChange={() => chooseLevel(l.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          start();
                        }
                      }}
                    />
                    <span className="wd-level-num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="wd-level-title">
                      {l.title}
                      {recommended === l.id && <span className="chip chip--marigold wd-level-badge">Recommended</span>}
                    </span>
                    <span className="wd-level-blurb">{l.blurb}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {stats.bestScore > 0 && <p className="wd-best">Your best round: {stats.bestScore} points</p>}
        </StartPanel>
      </div>
    );
  }

  /* ── Results ── */
  if (phase === 'results') {
    const won = correctCount >= WIN_AT;
    const nextId = nextLevelId(level.id);
    const nextLink = won
      ? nextId
        ? { href: `/games/word-decoder?level=${nextId}`, label: `Next level: ${getLevel(nextId)!.title}` }
        : { href: '/learn/first-contractions', label: 'Next: your first contractions' }
      : { href: `/learn/${level.lesson}`, label: 'Review the lesson' };
    return (
      <div className="game-board" data-testid="game-board">
        {region}
        <Results
          title={won ? 'Lovely reading!' : 'Nice practice!'}
          summary={`${correctCount} of ${items.length} read correctly · ${totalPoints} points${
            hintsTotal ? ` · ${hintsTotal} hint${hintsTotal === 1 ? '' : 's'}` : ''
          }`}
          stars={starsFor(correctCount, hintsTotal)}
          best={stats.bestScore > 0 ? `${stats.bestScore} points` : undefined}
          isNewBest={totalPoints > 0 && totalPoints > bestBefore}
          onReplay={start}
          replayLabel="Play this level again"
          next={nextLink}
        >
          <ul className="wd-recap" aria-label="Your words">
            {results.map((r, i) => (
              <li key={i} className={r.correct ? 'is-correct' : 'is-wrong'}>
                <span aria-hidden="true">{r.correct ? '✓' : '✗'}</span>
                <span className="sr-only">{r.correct ? 'Correct:' : 'Missed:'}</span> {r.text}
              </li>
            ))}
          </ul>
        </Results>
      </div>
    );
  }

  /* ── Play ── */
  if (!item) return null;
  const size = cells.length > 10 ? 'md' : 'lg';
  const highlightPos = status !== 'done' && revealed > 0 ? readable[revealed - 1] : -1;
  const hintsSoFar = readable
    .slice(0, revealed)
    .map((pos, i) => `cell ${i + 1} is ${spokenFor(cells[pos])}`)
    .join(', ');

  return (
    <div className="game-board wd-board" data-testid="game-board" data-answer={item.text}>
      {region}
      <div className="game-board-toolbar">
        <h2 className="wd-level-heading">{level.title}</h2>
        <Hud
          items={[
            { label: 'Word', value: `${index + 1} / ${items.length}` },
            { label: 'Points', value: totalPoints },
            { label: 'Correct', value: correctCount, tone: 'streak' },
          ]}
        />
      </div>

      <div className="game-cell-stage wd-stage">
        <div
          key={index}
          id="wd-braille"
          className={`wd-run wd-run--${size}`}
          role="img"
          aria-label={brailleLabel(cells)}
        >
          {cells.map((c, i) =>
            c.dots.length === 0 ? (
              <span key={i} className="wd-space" />
            ) : (
              <span
                key={i}
                className={`wd-slot${revealedSet.has(i) ? ' is-revealed' : ''}${i === highlightPos ? ' is-hint' : ''}`}
              >
                <Cell dots={c.dots} size={size} pop />
                {revealedSet.has(i) ? (
                  <span className={`wd-caption${captionFor(c).length > 2 ? ' wd-caption--long' : ''}`}>
                    {captionFor(c)}
                  </span>
                ) : (
                  <span className="wd-caption" />
                )}
              </span>
            ),
          )}
        </div>
      </div>
      {revealed > 0 && status !== 'done' && <p className="sr-only">Hints so far: {hintsSoFar}.</p>}

      {status === 'done' && (
        <p className="wd-reveal">
          It says <strong className="wd-reveal-word">{item.text}</strong>
        </p>
      )}

      <form className="wd-answer" onSubmit={check} noValidate>
        <label htmlFor="wd-answer-input" className="label wd-answer-label">
          What does it say?
          {CASE_SENSITIVE.has(level.id) && <span className="wd-answer-note"> Capitals count.</span>}
        </label>
        <div className="wd-answer-row">
          <input
            id="wd-answer-input"
            ref={inputRef}
            className="input answer-input"
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            readOnly={status === 'done'}
            aria-invalid={status === 'retry' ? true : undefined}
            aria-describedby="wd-braille wd-feedback"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          {status !== 'done' ? (
            <button type="submit" className="btn btn--pine">
              Check
            </button>
          ) : (
            <button type="button" ref={nextRef} className="btn" onClick={next}>
              {index + 1 >= items.length ? 'See my results' : 'Next word'}
            </button>
          )}
        </div>
        <div className="cluster wd-tools">
          <button
            type="button"
            className="btn btn--paper btn--sm"
            onClick={hint}
            disabled={status === 'done' || allRevealed}
          >
            Hint{revealed > 0 ? ` (${revealed} used)` : ''}
          </button>
          <span className="wd-hint-cost">Each hint costs {HINT_COST} points.</span>
        </div>
      </form>

      <p
        id="wd-feedback"
        className={`feedback${feedback?.tone === 'good' ? ' feedback--good' : feedback?.tone === 'bad' ? ' feedback--bad' : ''}`}
      >
        {feedback && (
          <span className="feedback-pill">
            <span aria-hidden="true">{feedback.tone === 'good' ? '✓ ' : feedback.tone === 'bad' ? '✗ ' : ''}</span>
            {feedback.text}
            {feedback.tone === 'good' && <span className="wd-points"> +{lastPoints}</span>}
          </span>
        )}
      </p>
    </div>
  );
}
