'use client';

import '@/styles/games/contraction-sprint.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Choices,
  Hud,
  ModePicker,
  Results,
  StartPanel,
  dotSimilarity,
  shuffle,
  useAnnouncer,
  useGameKeys,
  useSession,
} from '@/components/games/kit';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import { contractedBrailleEntries, type ContractionType } from '@/lib/contracted-braille-map';
import { getContractionWords, type ContractionWord } from '@/lib/contraction-words';
import { CONTRACTIONS, LETTERS, describe, describeCells, fromGrid, type Dots } from '@/lib/ueb';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import type { Difficulty } from '@/lib/progress-types';

/* ── Question generation (pure, exported for tests) ──────────────────────── */

export interface SprintItem {
  /** Print text of the contraction, e.g. "the", "ch", "but". */
  text: string;
  dots: number[];
  type: ContractionType;
}

export type QuestionKind = 'recognition' | 'recall' | 'application';

export interface SprintQuestion {
  kind: QuestionKind;
  answer: SprintItem;
  /** Four options with distinct texts AND distinct cells (one is the answer). */
  options: SprintItem[];
  /** Application questions: the print word and its contracted braille. */
  word?: { print: string; cells: Dots[] };
}

/** Every contraction once, by print text (e.g. "be" is listed twice in UEB, with the same cell). */
const ALL_ITEMS: SprintItem[] = (() => {
  const seen = new Set<string>();
  const out: SprintItem[] = [];
  for (const e of contractedBrailleEntries) {
    if (seen.has(e.label)) continue;
    seen.add(e.label);
    out.push({ text: e.label, dots: fromGrid(e.pattern), type: e.type });
  }
  return out;
})();

const TYPES_BY_LEVEL: Record<Difficulty, ContractionType[]> = {
  beginner: ['wordsign'],
  intermediate: ['wordsign', 'strong', 'groupsign-strong'],
  advanced: ['wordsign', 'strong', 'groupsign-strong', 'groupsign-lower', 'wordsign-lower'],
};

export function poolFor(level: Difficulty): SprintItem[] {
  const types = TYPES_BY_LEVEL[level];
  return ALL_ITEMS.filter((i) => types.includes(i.type));
}

const cellKey = (dots: readonly number[]) => [...dots].sort().join('');

/**
 * The answer plus three distractors. No two options ever share a cell or a print text, so a
 * question can never have two right answers. Look-alike cells are preferred, so it is a real
 * reading test.
 */
function buildOptions(answer: SprintItem, pool: SprintItem[], exclude: (i: SprintItem) => boolean): SprintItem[] {
  const usedCells = new Set([cellKey(answer.dots)]);
  const usedText = new Set([answer.text]);
  const out: SprintItem[] = [answer];
  const take = (candidates: SprintItem[]) => {
    const ranked = shuffle(candidates).sort(
      (a, b) => dotSimilarity(answer.dots, b.dots) - dotSimilarity(answer.dots, a.dots),
    );
    const ordered = [...shuffle(ranked.slice(0, 8)), ...shuffle(ranked.slice(8))];
    for (const c of ordered) {
      if (out.length === 4) return;
      if (exclude(c) || usedCells.has(cellKey(c.dots)) || usedText.has(c.text)) continue;
      out.push(c);
      usedCells.add(cellKey(c.dots));
      usedText.add(c.text);
    }
  };
  take(pool);
  if (out.length < 4) take(ALL_ITEMS);
  return shuffle(out);
}

function pieceDots(piece: string): number[] {
  if (/^[A-Z]$/.test(piece)) return [...LETTERS[piece.toLowerCase()]];
  const c = CONTRACTIONS.find((x) => x.text === piece);
  if (!c) throw new Error(`contraction-sprint: no cell for piece "${piece}"`);
  return [...c.dots];
}

function makeApplication(level: Difficulty, pool: SprintItem[], words: ContractionWord[]): SprintQuestion | null {
  const eligible = words.filter((w) => w.pieces.length > 1 && w.pieces.some((p) => !/^[A-Z]$/.test(p)));
  if (eligible.length === 0) return null;
  const word = eligible[Math.floor(Math.random() * eligible.length)];
  const contractionPieces = word.pieces.filter((p) => !/^[A-Z]$/.test(p));
  const target = contractionPieces[Math.floor(Math.random() * contractionPieces.length)];
  const answer = ALL_ITEMS.find((i) => i.text === target);
  if (!answer) return null;
  const lower = word.word.toLowerCase();
  // Never offer another piece of this word, or a letter group that appears in it in print:
  // either would also look like a right answer.
  const exclude = (i: SprintItem) => i.text !== answer.text && (word.pieces.includes(i.text) || lower.includes(i.text));
  return {
    kind: 'application',
    answer,
    options: buildOptions(answer, pool, exclude),
    word: { print: word.word, cells: word.pieces.map(pieceDots) },
  };
}

/** Generate one question for a level. `recent` holds recent answer texts to avoid repeats. */
export function makeQuestion(level: Difficulty, recent: string[] = []): SprintQuestion {
  const pool = poolFor(level);
  const roll = Math.random();
  const kind: QuestionKind =
    level === 'beginner'
      ? roll < 0.5
        ? 'recognition'
        : 'recall'
      : level === 'intermediate'
        ? roll < 0.35
          ? 'recognition'
          : roll < 0.7
            ? 'recall'
            : 'application'
        : roll < 0.3
          ? 'recognition'
          : roll < 0.6
            ? 'recall'
            : 'application';

  if (kind === 'application') {
    for (let i = 0; i < 6; i++) {
      const q = makeApplication(level, pool, getContractionWords(level));
      if (q && !recent.includes(q.answer.text)) return q;
    }
  }
  const fresh = pool.filter((i) => !recent.includes(i.text));
  const list = fresh.length > 0 ? fresh : pool;
  const answer = list[Math.floor(Math.random() * list.length)];
  return {
    kind: kind === 'application' ? 'recognition' : kind,
    answer,
    options: buildOptions(answer, pool, () => false),
  };
}

/* ── Component ───────────────────────────────────────────────────────────── */

const RELAXED_QUESTIONS = 20;

type Pace = 'timed' | 'relaxed';
type Phase = 'ready' | 'playing' | 'done';

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Wordsigns', hint: 'but, can, child…' },
  { value: 'intermediate', label: 'Plus groupsigns', hint: 'and, the, ch, ing…' },
  { value: 'advanced', label: 'Everything', hint: 'adds ea, be, con…' },
];

const PACES: { value: Pace; label: string; hint: string }[] = [
  { value: 'timed', label: 'Sprint', hint: 'beat the clock' },
  { value: 'relaxed', label: 'Relaxed', hint: `no timer, ${RELAXED_QUESTIONS} questions` },
];

const PROMPTS: Record<QuestionKind, string> = {
  recognition: 'What does this cell stand for?',
  recall: 'Which cell is this contraction?',
  application: 'Which contraction is used to write this word?',
};

export default function BrailleContractionSprint() {
  const { difficulty, setDifficulty, stats, finish, answer: recordAnswer } = useSession('contraction-sprint');
  const { announce, region } = useAnnouncer();

  const [pace, setPace] = useState<Pace>('timed');
  const [phase, setPhase] = useState<Phase>('ready');
  const [question, setQuestion] = useState<SprintQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [delta, setDelta] = useState<{ text: string; key: number } | null>(null);
  const [newBest, setNewBest] = useState(false);

  const limit = (getDifficultyParams('contraction-sprint', difficulty) as { timeLimit: number }).timeLimit || 60;
  const recent = useRef<string[]>([]);
  const timeRef = useRef(60);
  const scoreRef = useRef(0);
  const endedRef = useRef(true);
  const tickRef = useRef<ReturnType<typeof setInterval>>();
  const advanceRef = useRef<ReturnType<typeof setTimeout>>();
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const stopTimers = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (advanceRef.current) clearTimeout(advanceRef.current);
  }, []);
  useEffect(() => stopTimers, [stopTimers]);

  const end = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopTimers();
    const s = scoreRef.current;
    setNewBest(s > stats.bestScore);
    finish(pace === 'timed' ? s >= 5 : s >= RELAXED_QUESTIONS / 2, s);
    setPhase('done');
  }, [stopTimers, stats.bestScore, finish, pace]);

  const nextQuestion = useCallback(() => {
    const q = makeQuestion(difficulty, recent.current);
    recent.current = [...recent.current, q.answer.text].slice(-4);
    setQuestion(q);
    setPicked(null);
  }, [difficulty]);

  const start = useCallback(() => {
    stopTimers();
    endedRef.current = false;
    recent.current = [];
    scoreRef.current = 0;
    timeRef.current = limit;
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCount(0);
    setTimeLeft(limit);
    setDelta(null);
    setNewBest(false);
    setPhase('playing');
    nextQuestion();
    if (pace === 'timed') {
      tickRef.current = setInterval(() => {
        timeRef.current = Math.max(0, timeRef.current - 1);
        setTimeLeft(timeRef.current);
        if (timeRef.current === 10) announce('10 seconds left.');
        if (timeRef.current <= 0) end();
      }, 1000);
    }
  }, [stopTimers, limit, nextQuestion, pace, announce, end]);

  const advance = useCallback(() => {
    if (endedRef.current) return;
    const done = count + 1;
    setCount(done);
    if (pace === 'relaxed' && done >= RELAXED_QUESTIONS) {
      end();
      return;
    }
    nextQuestion();
  }, [count, pace, end, nextQuestion]);

  const pick = useCallback(
    (id: string) => {
      if (phase !== 'playing' || !question || picked !== null) return;
      const correct = id === question.answer.text;
      setPicked(id);
      recordAnswer(`contraction:${question.answer.text}`, correct);
      const ans = question.answer;
      if (correct) {
        scoreRef.current += 1;
        setScore(scoreRef.current);
        setStreak((s) => {
          setBestStreak((b) => Math.max(b, s + 1));
          return s + 1;
        });
        announce(`Correct! “${ans.text}” is ${describe(ans.dots)}.${pace === 'timed' ? ' Plus 2 seconds.' : ''}`);
      } else {
        setStreak(0);
        announce(
          `Not quite. The answer is “${ans.text}”, ${describe(ans.dots)}.${pace === 'timed' ? ' Minus 3 seconds.' : ''}`,
        );
      }
      if (pace === 'timed') {
        timeRef.current = Math.max(0, timeRef.current + (correct ? 2 : -3));
        setTimeLeft(timeRef.current);
        setDelta({ text: correct ? '+2s' : '−3s', key: Date.now() });
        if (timeRef.current <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          advanceRef.current = setTimeout(end, 900);
          return;
        }
        advanceRef.current = setTimeout(advance, correct ? 450 : 1100);
      }
    },
    [phase, question, picked, recordAnswer, announce, pace, end, advance],
  );

  // Relaxed mode: focus "Next" after answering so keyboard users keep their place.
  useEffect(() => {
    if (pace === 'relaxed' && picked !== null) nextBtnRef.current?.focus();
  }, [pace, picked]);

  useGameKeys(
    (e) => {
      if (e.key !== 'Enter' || e.target instanceof HTMLButtonElement) return;
      if (phase === 'ready') {
        e.preventDefault();
        start();
      } else if (phase === 'playing' && pace === 'relaxed' && picked !== null) {
        e.preventDefault();
        advance();
      }
    },
    { enabled: phase === 'ready' || (phase === 'playing' && picked !== null) },
  );

  const answered = picked !== null;
  const answerOk = answered && question && picked === question.answer.text;

  return (
    <div className="game-board cs-board" data-testid="game-board">
      {region}

      {phase === 'ready' && (
        <StartPanel heading="Ready for a contraction sprint?" onStart={start}>
          <p className="game-prompt-sub">
            Read a contraction, find its cell, or spot it inside a word. Choose with keys 1–4.
          </p>
          <div className="cs-options">
            <ModePicker
              legend="Contractions"
              name="cs-level"
              value={difficulty}
              options={LEVELS}
              onChange={setDifficulty}
            />
            <ModePicker legend="Pace" name="cs-pace" value={pace} options={PACES} onChange={setPace} />
          </div>
          {pace === 'timed' && (
            <p className="cs-rule">You start with {limit} seconds. Right answers add 2 seconds; misses take 3 away.</p>
          )}
        </StartPanel>
      )}

      {phase === 'playing' && question && (
        <>
          <Hud
            items={
              pace === 'timed'
                ? [
                    { label: 'Time', value: `${timeLeft}s`, tone: timeLeft <= 10 ? 'warn' : 'timer' },
                    { label: 'Score', value: score },
                    { label: 'Streak', value: streak, tone: 'streak' },
                  ]
                : [
                    { label: 'Question', value: `${Math.min(count + 1, RELAXED_QUESTIONS)} of ${RELAXED_QUESTIONS}` },
                    { label: 'Score', value: score },
                    { label: 'Streak', value: streak, tone: 'streak' },
                  ]
            }
          />
          {pace === 'timed' && (
            <div className="cs-timer-row" aria-hidden="true">
              <div className={`timer-bar${timeLeft <= 10 ? ' is-low' : ''}`}>
                <span style={{ width: `${Math.min(100, (timeLeft / limit) * 100)}%` }} />
              </div>
              {delta && (
                <span key={delta.key} className={`cs-delta ${delta.text.startsWith('+') ? 'is-plus' : 'is-minus'}`}>
                  {delta.text}
                </span>
              )}
            </div>
          )}

          <div className="cs-question">
            <h2 className="game-prompt cs-prompt">{PROMPTS[question.kind]}</h2>
            <div className="game-cell-stage cs-stage">
              {question.kind === 'recognition' && (
                <Cell key={question.answer.text} dots={question.answer.dots} size="xl" pop label="Mystery cell" />
              )}
              {question.kind === 'recall' && <span className="cs-print">{question.answer.text}</span>}
              {question.kind === 'application' && question.word && (
                <div className="cs-word">
                  <span className="cs-print cs-print--word">{question.word.print.toLowerCase()}</span>
                  {answered && (
                    <BrailleText
                      cells={question.word.cells}
                      size="md"
                      label={`${question.word.print.toLowerCase()} in braille: ${describeCells(question.word.cells)}`}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <Choices
            choices={question.options.map((o) =>
              question.kind === 'recall'
                ? {
                    id: o.text,
                    label: describe(o.dots),
                    content: <Cell dots={o.dots} size="md" />,
                  }
                : { id: o.text, content: <span className="cs-choice-text">{o.text}</span> },
            )}
            onPick={pick}
            correctId={answered ? question.answer.text : null}
            pickedId={picked}
            disabled={pace === 'relaxed' && answered}
            label="Answers"
          />

          <div
            className={`feedback${answered ? (answerOk ? ' feedback--good' : ' feedback--bad') : ''}`}
            aria-hidden="true"
          >
            {answered && (
              <span className="feedback-pill cs-feedback">
                {answerOk ? '✓ Correct!' : '✗ It’s'} <strong>{question.answer.text}</strong>
                <Cell dots={question.answer.dots} size="sm" />
              </span>
            )}
          </div>

          {pace === 'relaxed' && answered && (
            <div className="cs-actions">
              <button ref={nextBtnRef} type="button" className="btn btn--pine" onClick={advance}>
                {count + 1 >= RELAXED_QUESTIONS ? 'See results' : 'Next question'}
              </button>
            </div>
          )}
        </>
      )}

      {phase === 'done' && (
        <Results
          title={
            score === 0 ? 'Keep practicing!' : score < 5 ? 'Good effort!' : score < 12 ? 'Great sprint!' : 'Amazing!'
          }
          summary={
            pace === 'timed'
              ? `${score} correct · best streak ${bestStreak}`
              : `${score} of ${RELAXED_QUESTIONS} correct · best streak ${bestStreak}`
          }
          stars={score >= 15 ? 3 : score >= 10 ? 2 : score >= 5 ? 1 : 0}
          best={Math.max(stats.bestScore, score) > 0 ? `${Math.max(stats.bestScore, score)} correct` : undefined}
          isNewBest={newBest}
          onReplay={start}
        />
      )}
    </div>
  );
}
