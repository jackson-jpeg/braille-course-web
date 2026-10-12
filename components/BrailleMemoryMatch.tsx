'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { describeCell } from '@/lib/braille/prose';
import { type MemoryCard, PAIR_COUNT, cardCell, isMatch as cardsMatch, newDeck } from '@/lib/games/memorymatch';

interface Card extends MemoryCard {
  flipped: boolean;
  matched: boolean;
}

function dealCards(): Card[] {
  return newDeck(PAIR_COUNT).map((c) => ({ ...c, flipped: false, matched: false }));
}

function BrailleFace({ letter }: { letter: string }) {
  return <BrailleCell cell={cardCell({ letter })} className="memorymatch-braille" dotClassName="memorymatch-dot" />;
}

export default function BrailleMemoryMatch() {
  const { recordResult } = useGameProgress('memorymatch');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [won, setWon] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const matchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const movesRef = useRef(moves);
  movesRef.current = moves;

  const startGame = useCallback(() => {
    setCards(dealCards());
    setFlippedIds([]);
    setMoves(0);
    setMatchedPairs(0);
    setWon(false);
    setChecking(false);
    setTip('');
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // Cleanup match/mismatch timer on unmount
  useEffect(() => {
    return () => {
      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
    };
  }, []);

  const handleFlip = useCallback(
    (cardId: number) => {
      if (checking) return;
      if (flippedIds.length >= 2) return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.flipped || card.matched) return;

      const newFlipped = [...flippedIds, cardId];
      setFlippedIds(newFlipped);

      // Reveal this card
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setChecking(true);

        const first = cards.find((c) => c.id === newFlipped[0])!;
        const second = cards.find((c) => c.id === newFlipped[1])!;

        const isMatch = cardsMatch(first, second);

        if (isMatch) {
          matchTimerRef.current = setTimeout(() => {
            setCards((prev) =>
              prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, matched: true, flipped: true } : c)),
            );
            setMatchedPairs((p) => {
              const next = p + 1;
              if (next === PAIR_COUNT) {
                setWon(true);
                setTip(getRandomTip().fact);
                const finalMoves = movesRef.current + 1; // +1 for this move
                const score = Math.max(1, PAIR_COUNT * 2 - finalMoves);
                const achievements = recordResult(true, score);
                pushAchievements(achievements);
              }
              return next;
            });
            setFlippedIds([]);
            setChecking(false);
          }, 600);
        } else {
          matchTimerRef.current = setTimeout(() => {
            setCards((prev) =>
              prev.map((c) => (c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c)),
            );
            setFlippedIds([]);
            setChecking(false);
          }, 1000);
        }
      }
    },
    [cards, flippedIds, checking, recordResult],
  );

  return (
    <div className="memorymatch-container" ref={containerRef}>
      <div className="memorymatch-header">
        <span className="section-label">Memory</span>
        <h2>Memory Match</h2>
        <p>Match braille patterns to their letters</p>
      </div>

      <div className="memorymatch-body">
        <div className="memorymatch-stats" aria-live="polite" aria-atomic="true">
          <span>
            Moves: <strong>{moves}</strong>
          </span>
          <span>
            Pairs: <strong>{matchedPairs}</strong> / {PAIR_COUNT}
          </span>
        </div>

        <div className="memorymatch-grid" role="group" aria-label="Memory game cards">
          {cards.map((card) => (
            <button
              key={card.id}
              className={`memorymatch-card${card.flipped || card.matched ? ' flipped' : ''}${card.matched ? ' matched' : ''}`}
              onClick={() => handleFlip(card.id)}
              disabled={card.flipped || card.matched || checking}
              aria-label={
                card.flipped || card.matched
                  ? card.type === 'letter'
                    ? `letter ${card.letter}`
                    : `Braille cell, ${describeCell(cardCell(card))}`
                  : 'Face-down card'
              }
            >
              <div className="memorymatch-card-inner">
                <div className="memorymatch-card-front">
                  {card.type === 'braille' ? (
                    <BrailleFace letter={card.letter} />
                  ) : (
                    <span className="memorymatch-card-letter">{card.letter}</span>
                  )}
                </div>
                <div className="memorymatch-card-back">
                  <span className="memorymatch-card-back-icon">?</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {won && (
          <div className="memorymatch-win" aria-live="polite">
            <div>All pairs matched in {moves} moves!</div>
            {tip && <p className="memorymatch-tip">{tip}</p>}
          </div>
        )}

        <button className="memorymatch-play-again" onClick={startGame}>
          Play Again
        </button>
      </div>
    </div>
  );
}
