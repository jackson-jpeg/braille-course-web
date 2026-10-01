'use client';

import '@/styles/games/memory-match.css';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Cell from '@/components/ui/Cell';
import {
  Hud,
  ModePicker,
  Results,
  StartPanel,
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
type Face = 'cell' | 'print';

interface Card {
  id: number;
  letter: string;
  face: Face;
}

const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

function pairsFor(d: Difficulty): number {
  const p = getDifficultyParams('memorymatch', d) as { pairs?: number };
  return p.pairs ?? 6;
}

/** Letters only (a–z): digits share their cells with a–j, so mixing them in made unfair look-alike pairs. */
function buildDeck(pairs: number): Card[] {
  const letters = shuffle(ALPHABET).slice(0, pairs);
  let id = 0;
  const cards: Card[] = [];
  for (const letter of letters) {
    cards.push({ id: id++, letter, face: 'cell' });
    cards.push({ id: id++, letter, face: 'print' });
  }
  return shuffle(cards);
}

function faceText(c: Card) {
  return c.face === 'print' ? `letter ${c.letter}` : `braille cell, ${describe(LETTERS[c.letter])}`;
}

export default function BrailleMemoryMatch() {
  const { difficulty, setDifficulty, stats, finish, answer } = useSession('memorymatch');
  const { announce, region } = useAnnouncer();
  const [phase, setPhase] = useState<Phase>('start');
  const [cards, setCards] = useState<Card[]>([]);
  const [up, setUp] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [focusIdx, setFocusIdx] = useState(0);
  const [tip, setTip] = useState('');
  const [result, setResult] = useState<{ score: number; best: number; isNewBest: boolean } | null>(null);

  const pairs = pairsFor(difficulty);
  const cols = pairs >= 10 ? 5 : 4;
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const upRef = useRef<number[]>([]);
  const flipBack = useRef<ReturnType<typeof setTimeout>>();
  const doneTimer = useRef<ReturnType<typeof setTimeout>>();
  upRef.current = up;

  useEffect(
    () => () => {
      clearTimeout(flipBack.current);
      clearTimeout(doneTimer.current);
    },
    [],
  );

  const start = useCallback(() => {
    clearTimeout(flipBack.current);
    clearTimeout(doneTimer.current);
    setCards(buildDeck(pairs));
    setUp([]);
    upRef.current = [];
    setMatched([]);
    setMoves(0);
    setFocusIdx(0);
    setResult(null);
    setPhase('play');
    announce(`${pairs * 2} cards, face down, in ${cols} columns. Find each letter and its braille cell.`);
  }, [announce, cols, pairs]);

  // Focus the first card when a round starts.
  useEffect(() => {
    if (phase === 'play') btnRefs.current[0]?.focus();
  }, [phase]);

  const flip = useCallback(
    (idx: number) => {
      const card = cards[idx];
      if (!card || matched.includes(card.letter)) return;
      let current = upRef.current;
      if (current.includes(card.id)) return;
      // Two unmatched cards still showing: turn them back now instead of waiting.
      if (current.length === 2) {
        clearTimeout(flipBack.current);
        current = [];
      }
      const next = [...current, card.id];
      upRef.current = next;
      setUp(next);

      if (next.length < 2) {
        announce(`${faceText(card)}.`);
        return;
      }

      const first = cards.find((c) => c.id === next[0])!;
      const moveCount = moves + 1;
      setMoves(moveCount);
      const isMatch = first.letter === card.letter && first.face !== card.face;
      const braille = first.face === 'cell' ? first : card;
      if (first.face !== card.face) answer(`letter:${braille.letter}`, isMatch);

      if (isMatch) {
        const nowMatched = [...matched, card.letter];
        setMatched(nowMatched);
        upRef.current = [];
        setUp([]);
        const left = pairs - nowMatched.length;
        announce(
          `${faceText(card)}. Match! ${card.letter} is ${describe(LETTERS[card.letter])}. ${left ? `${left} pairs left.` : ''}`,
        );
        if (left === 0) {
          const score = Math.max(1, pairs * 3 - moveCount);
          const prevBest = stats.bestScore;
          finish(true, score);
          setTip(getRandomTip().fact);
          doneTimer.current = setTimeout(() => {
            setResult({ score, best: Math.max(prevBest, score), isNewBest: score > prevBest });
            setPhase('done');
          }, 700);
        }
      } else {
        announce(`${faceText(card)}. No match.`);
        flipBack.current = setTimeout(() => {
          upRef.current = [];
          setUp([]);
        }, 1400);
      }
    },
    [announce, answer, cards, finish, matched, moves, pairs, stats.bestScore],
  );

  const onGridKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const n = cards.length;
    let next = focusIdx;
    switch (e.key) {
      case 'ArrowRight':
        next = Math.min(n - 1, focusIdx + 1);
        break;
      case 'ArrowLeft':
        next = Math.max(0, focusIdx - 1);
        break;
      case 'ArrowDown':
        next = focusIdx + cols < n ? focusIdx + cols : focusIdx;
        break;
      case 'ArrowUp':
        next = focusIdx - cols >= 0 ? focusIdx - cols : focusIdx;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = n - 1;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        flip(focusIdx);
        return;
      default:
        return;
    }
    e.preventDefault();
    setFocusIdx(next);
    btnRefs.current[next]?.focus();
  };

  useGameKeys((e) => {
    if (phase === 'play' || e.key !== 'Enter') return;
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
    e.preventDefault();
    start();
  });

  const stars = moves <= pairs * 1.5 ? 3 : moves <= pairs * 2.2 ? 2 : 1;

  return (
    <div className="game-board mem" data-testid="game-board">
      {region}

      {phase === 'start' && (
        <StartPanel heading="Find the pairs" onStart={start}>
          <p className="game-prompt-sub">
            Turn over two cards at a time. Match each print letter with its braille cell.
          </p>
          <ModePicker
            legend="Level"
            name="mem-level"
            value={difficulty}
            onChange={setDifficulty}
            options={LEVELS.map((d) => ({ value: d, label: DIFFICULTY_INFO[d].label, hint: `${pairsFor(d)} pairs` }))}
          />
        </StartPanel>
      )}

      {phase === 'play' && (
        <>
          <div className="game-board-toolbar">
            <h2 className="mem-title">Find the pairs</h2>
            <Hud
              items={[
                { label: 'Moves', value: moves },
                { label: 'Pairs', value: `${matched.length} / ${pairs}`, tone: 'streak' },
              ]}
            />
          </div>
          <p id="mem-help" className="game-prompt-sub">
            Use the arrow keys to move between cards. Press Enter or Space to turn one over.
          </p>
          <div
            className="mem-grid"
            role="group"
            aria-label={`Cards, ${cols} per row`}
            aria-describedby="mem-help"
            style={{ '--mem-cols': cols } as React.CSSProperties}
            onKeyDown={onGridKey}
          >
            {cards.map((card, i) => {
              const isMatched = matched.includes(card.letter);
              const isUp = isMatched || up.includes(card.id);
              const row = Math.floor(i / cols) + 1;
              const col = (i % cols) + 1;
              return (
                <button
                  key={card.id}
                  ref={(el) => {
                    btnRefs.current[i] = el;
                  }}
                  type="button"
                  className={`mem-card${isUp ? ' is-up' : ''}${isMatched ? ' is-matched' : ''}`}
                  tabIndex={i === focusIdx ? 0 : -1}
                  aria-disabled={isUp || undefined}
                  aria-label={`Row ${row}, card ${col}: ${isUp ? faceText(card) : 'face down'}${isMatched ? ', matched' : ''}`}
                  onFocus={() => setFocusIdx(i)}
                  onClick={() => flip(i)}
                >
                  <span className="mem-card-inner" aria-hidden="true">
                    <span className="mem-card-back" />
                    <span className="mem-card-front">
                      {card.face === 'cell' ? (
                        <Cell dots={LETTERS[card.letter]} size="md" />
                      ) : (
                        <span className="mem-letter">{card.letter}</span>
                      )}
                    </span>
                  </span>
                  {isMatched && (
                    <span className="mem-tick" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="game-board-toolbar">
            <button type="button" className="btn btn--paper btn--sm" onClick={start}>
              New cards
            </button>
          </div>
        </>
      )}

      {phase === 'done' && result && (
        <Results
          title="All pairs found!"
          summary={`${pairs} pairs in ${moves} moves · ${result.score} points`}
          stars={stars}
          best={`${result.best} points`}
          isNewBest={result.isNewBest}
          onReplay={start}
        >
          {tip && <p className="mem-tip">{tip}</p>}
        </Results>
      )}
    </div>
  );
}
