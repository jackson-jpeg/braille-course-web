'use client';

import '@/styles/games/sequence.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { ALPHABET, LETTERS, describe } from '@/lib/ueb';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import type { Difficulty } from '@/lib/progress-types';

const ROUNDS = 5;

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'beginner', label: '4 cells', hint: 'any letters' },
  { value: 'intermediate', label: '6 cells', hint: 'any letters' },
  { value: 'advanced', label: '8 cells', hint: 'look-alike letters' },
];

/** Pick N different letters; Advanced picks letters whose cells look alike. */
function pickLetters(count: number, lookAlike: boolean): string[] {
  if (!lookAlike) return shuffle(ALPHABET).slice(0, count);
  const anchor = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  const near = shuffle(ALPHABET.filter((l) => l !== anchor))
    .sort((a, b) => dotSimilarity(LETTERS[anchor], LETTERS[b]) - dotSimilarity(LETTERS[anchor], LETTERS[a]))
    .slice(0, count * 2);
  return [anchor, ...shuffle(near).slice(0, count - 1)];
}

function scramble(letters: string[]): string[] {
  const sorted = [...letters].sort();
  let out = shuffle(letters);
  for (let i = 0; i < 20 && out.every((l, k) => l === sorted[k]); i++) out = shuffle(letters);
  return out;
}

type Phase = 'ready' | 'playing' | 'checked' | 'done';

/** Sequence: put a row of braille letters into alphabetical order by swapping cards. */
export default function BrailleSequence() {
  const { difficulty, setDifficulty, stats, finish, answer } = useSession('sequence');
  const { announce, region } = useAnnouncer();

  const [phase, setPhase] = useState<Phase>('ready');
  const [cards, setCards] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[] | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [newBest, setNewBest] = useState(false);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<number | null>(null);

  const newRound = useCallback(() => {
    const { letterCount } = getDifficultyParams('sequence', difficulty) as { letterCount: number };
    setCards(scramble(pickLetters(letterCount, difficulty === 'advanced')));
    setPicked(null);
    setResults(null);
    setPhase('playing');
  }, [difficulty]);

  const start = useCallback(() => {
    setRound(0);
    setScore(0);
    setNewBest(false);
    newRound();
  }, [newRound]);

  const swap = useCallback(
    (a: number, b: number, keepPicked: boolean) => {
      setCards((prev) => {
        const next = [...prev];
        [next[a], next[b]] = [next[b], next[a]];
        return next;
      });
      setPicked(keepPicked ? b : null);
      announce(`Swapped cards ${a + 1} and ${b + 1}.`);
    },
    [announce],
  );

  /** Pick a card up, put it back, or swap it with the one already picked. */
  const choose = useCallback(
    (i: number) => {
      if (phase !== 'playing' || i < 0 || i >= cards.length) return;
      if (picked === null) {
        setPicked(i);
        announce(`Card ${i + 1} picked up. Choose another card to swap with.`);
      } else if (picked === i) {
        setPicked(null);
        announce(`Card ${i + 1} put back.`);
      } else {
        swap(picked, i, false);
      }
    },
    [phase, cards.length, picked, swap, announce],
  );

  const move = useCallback(
    (dir: -1 | 1) => {
      if (phase !== 'playing' || picked === null) return;
      const to = picked + dir;
      if (to < 0 || to >= cards.length) return;
      if (cardRefs.current.some((b) => b === document.activeElement)) focusAfter.current = to;
      swap(picked, to, true);
    },
    [phase, picked, cards.length, swap],
  );

  useEffect(() => {
    if (focusAfter.current !== null) {
      cardRefs.current[focusAfter.current]?.focus();
      focusAfter.current = null;
    }
  }, [cards]);

  const check = useCallback(() => {
    if (phase !== 'playing') return;
    const sorted = [...cards].sort();
    const perCard = cards.map((l, i) => l === sorted[i]);
    const ok = perCard.every(Boolean);
    cards.forEach((l, i) => answer(`letter:${l}`, perCard[i]));
    setResults(perCard);
    setPicked(null);
    setPhase('checked');
    if (ok) setScore((s) => s + 1);
    const inPlace = perCard.filter(Boolean).length;
    announce(
      ok
        ? `All in order! ${sorted.join(', ')}.`
        : `Not yet: ${inPlace} of ${cards.length} in the right place. The order is ${sorted.join(', ')}.`,
    );
  }, [phase, cards, answer, announce]);

  const next = useCallback(() => {
    if (phase !== 'checked') return;
    if (round + 1 >= ROUNDS) {
      setNewBest(score > stats.bestScore);
      finish(score >= Math.ceil(ROUNDS / 2), score);
      setPhase('done');
      return;
    }
    setRound(round + 1);
    newRound();
  }, [phase, round, score, stats.bestScore, finish, newRound]);

  useEffect(() => {
    if (phase === 'checked') nextRef.current?.focus();
  }, [phase]);

  useGameKeys((e) => {
    const onButton = e.target instanceof HTMLButtonElement;
    if (phase === 'ready' || phase === 'checked') {
      if (e.key === 'Enter' && !onButton) {
        e.preventDefault();
        if (phase === 'ready') start();
        else next();
      }
      return;
    }
    if (phase !== 'playing') return;
    const n = Number(e.key);
    if (Number.isInteger(n) && n >= 1 && n <= cards.length) {
      e.preventDefault();
      choose(n - 1);
    } else if (e.key === 'ArrowLeft' && picked !== null) {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'ArrowRight' && picked !== null) {
      e.preventDefault();
      move(1);
    } else if (e.key === 'Escape' && picked !== null) {
      e.preventDefault();
      setPicked(null);
      announce('Card put back.');
    } else if (e.key === 'Enter' && !onButton) {
      e.preventDefault();
      check();
    }
  });

  const sorted = [...cards].sort();

  return (
    <div className="game-board seq-board" data-testid="game-board">
      {region}

      {phase === 'ready' && (
        <StartPanel heading="Can you put the braille in ABC order?" onStart={start}>
          <p className="game-prompt-sub">
            Read each cell, then swap cards until the letters run from A to Z. Five rounds, no timer.
          </p>
          <ModePicker legend="Cards" name="seq-level" value={difficulty} options={LEVELS} onChange={setDifficulty} />
        </StartPanel>
      )}

      {(phase === 'playing' || phase === 'checked') && (
        <>
          <Hud
            items={[
              { label: 'Round', value: `${round + 1} of ${ROUNDS}` },
              { label: 'Score', value: score },
            ]}
          />
          <h2 className="game-prompt seq-prompt">Put these letters in ABC order</h2>
          <p className="game-prompt-sub seq-how">
            Choose a card, then another to swap them. Keys: card number to pick, ← → to move, Enter to check.
          </p>

          <ol className="seq-cards" aria-label="Cards, first to last">
            {cards.map((letter, i) => {
              const ok = results?.[i];
              return (
                <li key={letter} className="seq-slot">
                  <button
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    type="button"
                    className={`seq-card${picked === i ? ' is-picked' : ''}${
                      results ? (ok ? ' is-correct' : ' is-wrong') : ''
                    }`}
                    aria-pressed={phase === 'playing' ? picked === i : undefined}
                    aria-label={`Card ${i + 1}: ${describe(LETTERS[letter])}${
                      results ? `, letter ${letter}, ${ok ? 'in the right place' : 'out of place'}` : ''
                    }`}
                    onClick={() => choose(i)}
                    disabled={phase !== 'playing'}
                  >
                    <span className="seq-card-num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <Cell dots={LETTERS[letter]} size="lg" />
                    {picked === i && (
                      <span className="seq-tag" aria-hidden="true">
                        Moving
                      </span>
                    )}
                    {results && (
                      <span className="seq-reveal" aria-hidden="true">
                        {letter} <span className="seq-mark">{ok ? '✓' : '✗'}</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          {phase === 'playing' && (
            <div className="seq-actions">
              <button type="button" className="btn btn--pine" onClick={check}>
                Check order
              </button>
            </div>
          )}

          {phase === 'checked' && results && (
            <>
              <div
                className={`feedback ${results.every(Boolean) ? 'feedback--good' : 'feedback--bad'}`}
                aria-hidden="true"
              >
                <span className="feedback-pill">
                  {results.every(Boolean) ? '✓ All in order!' : '✗ Not quite. The order is:'}
                </span>
              </div>
              {!results.every(Boolean) && (
                <ol className="seq-answer" aria-label="Correct order">
                  {sorted.map((l) => (
                    <li key={l}>
                      <Cell dots={LETTERS[l]} size="sm" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ol>
              )}
              <div className="seq-actions">
                <button ref={nextRef} type="button" className="btn btn--pine" onClick={next}>
                  {round + 1 >= ROUNDS ? 'See results' : 'Next round'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {phase === 'done' && (
        <Results
          title={score === ROUNDS ? 'Perfect sequence!' : score >= 3 ? 'Well done!' : 'Keep practicing!'}
          summary={`${score} of ${ROUNDS} rounds in perfect order`}
          stars={score === ROUNDS ? 3 : score >= 4 ? 2 : score >= 3 ? 1 : 0}
          best={Math.max(stats.bestScore, score) > 0 ? `${Math.max(stats.bestScore, score)} of ${ROUNDS}` : undefined}
          isNewBest={newBest}
          onReplay={start}
        />
      )}
    </div>
  );
}
