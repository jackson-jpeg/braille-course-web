'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import DifficultySelector from '@/components/DifficultySelector';
import { describeCell } from '@/lib/braille/prose';
import {
  checkOrder as checkLetterOrder,
  correctOrder as alphabeticalOrder,
  pickLetters,
  scramble,
  sequenceCell,
} from '@/lib/games/sequence';

type Phase = 'playing' | 'checking' | 'result';

interface SequenceCard {
  letter: string;
}

function SeqBrailleCell({ letter }: { letter: string }) {
  return <BrailleCell cell={sequenceCell(letter)} className="seq-cell" dotClassName="seq-dot" />;
}

export default function BrailleSequence() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('sequence');
  const [phase, setPhase] = useState<Phase>('playing');
  const [cards, setCards] = useState<SequenceCard[]>([]);
  const [correctOrder, setCorrectOrder] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalRounds] = useState(5);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [cardResults, setCardResults] = useState<boolean[]>([]);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(score);
  scoreRef.current = score;
  // Refs for the check function to always read latest state
  const cardsRef = useRef(cards);
  cardsRef.current = cards;
  const correctOrderRef = useRef(correctOrder);
  correctOrderRef.current = correctOrder;

  const params = getDifficultyParams('sequence', difficulty) as { letterCount: number };

  const startRound = useCallback(() => {
    const letters = pickLetters(params.letterCount, difficulty);
    setCorrectOrder(alphabeticalOrder(letters));
    setCards(scramble(letters).map((letter) => ({ letter })));
    setSelectedIdx(null);
    setFeedback(null);
    setCardResults([]);
    setPhase('playing');
  }, [params.letterCount, difficulty]);

  const startGame = useCallback(() => {
    setScore(0);
    setRound(0);
    setTip('');
    startRound();
  }, [startRound]);

  useEffect(() => {
    startGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  const handleCardClick = useCallback(
    (index: number) => {
      if (phase !== 'playing') return;

      if (selectedIdx === null) {
        setSelectedIdx(index);
      } else if (selectedIdx === index) {
        setSelectedIdx(null);
      } else {
        // Swap cards
        const si = selectedIdx;
        setCards((prev) => {
          const next = [...prev];
          const temp = next[si];
          next[si] = next[index];
          next[index] = temp;
          return next;
        });
        setSelectedIdx(null);
      }
    },
    [phase, selectedIdx],
  );

  const checkOrder = useCallback(() => {
    if (phase !== 'playing') return;
    setPhase('checking');

    // Read from refs to guarantee latest state
    const currentCards = cardsRef.current;
    const expected = correctOrderRef.current;

    // Safety: if data is somehow empty, treat as wrong
    if (currentCards.length === 0 || expected.length === 0) {
      setFeedback(false);
      setCardResults([]);
      setTimeout(() => {
        startRound();
      }, 1500);
      return;
    }

    // Check each card individually
    const perCard = checkLetterOrder(
      currentCards.map((c) => c.letter),
      expected,
    );
    const isCorrect = perCard.every(Boolean);

    setCardResults(perCard);
    setFeedback(isCorrect);
    if (isCorrect) setScore((s) => s + 1);

    roundTimerRef.current = setTimeout(
      () => {
        const nextR = round + 1;
        setRound(nextR);
        if (nextR >= totalRounds) {
          const finalScore = scoreRef.current; // already includes this round (re-rendered before the timeout)
          setPhase('result');
          const achievements = recordResult(finalScore >= totalRounds / 2, finalScore);
          pushAchievements(achievements);
          setTip(getRandomTip().fact);
        } else {
          startRound();
        }
      },
      isCorrect ? 800 : 2000,
    );
  }, [phase, round, totalRounds, startRound, recordResult]);

  return (
    <div className="seq-container" ref={containerRef}>
      <div className="seq-header">
        <span className="section-label">Order</span>
        <h2>Braille Sequence</h2>
        <p>Arrange braille cells in alphabetical order</p>
        <DifficultySelector gameId="sequence" current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="seq-body">
        {phase !== 'result' && (
          <>
            <div className="seq-status" aria-live="polite" aria-atomic="true">
              <span>
                Round {round + 1} / {totalRounds}
              </span>
              <span>Score: {score}</span>
            </div>

            <p className="seq-instruction">Tap two cards to swap them. Arrange in a→z order.</p>

            <div className="seq-cards" role="group" aria-label="Braille sequence cards">
              {cards.map((card, i) => (
                <button
                  key={card.letter}
                  className={`seq-card ${selectedIdx === i ? 'selected' : ''} ${
                    cardResults.length > 0 ? (cardResults[i] ? 'correct' : 'wrong') : ''
                  }`}
                  onClick={() => handleCardClick(i)}
                  disabled={phase !== 'playing'}
                  aria-label={`Position ${i + 1}: braille cell, ${describeCell(sequenceCell(card.letter))}${feedback !== null ? `, letter ${card.letter}` : ''}`}
                >
                  <SeqBrailleCell letter={card.letter} />
                  {feedback !== null && <span className="seq-card-letter">{card.letter}</span>}
                  {cardResults.length > 0 && (
                    <span className={`seq-card-mark ${cardResults[i] ? 'correct' : 'wrong'}`}>
                      {cardResults[i] ? '✓' : '✗'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {phase === 'playing' && (
              <button className="seq-check-btn" onClick={checkOrder}>
                Check Order
              </button>
            )}

            {feedback !== null && (
              <div className={`seq-feedback ${feedback ? 'correct' : 'wrong'}`} aria-live="assertive">
                {feedback ? 'Correct order!' : `Correct: ${correctOrder.join(' → ')}`}
              </div>
            )}
          </>
        )}

        {phase === 'result' && (
          <div className="seq-result">
            <div className="seq-result-score">
              {score} / {totalRounds}
            </div>
            <div className="seq-result-label">
              {score === totalRounds ? 'Perfect sequence!' : score >= 3 ? 'Well done!' : 'Keep practicing!'}
            </div>
            {tip && <p className="seq-tip">{tip}</p>}
            <button className="seq-start-btn" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
