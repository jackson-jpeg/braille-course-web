'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap, computeSimilarity } from '@/lib/braille-map';
import SharedBrailleCell from '@/components/BrailleCell';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import DifficultySelector from '@/components/DifficultySelector';

const ALL_LETTERS = Object.keys(brailleMap).filter((k) => /^[A-Z]$/.test(k));

type Phase = 'playing' | 'checking' | 'result';

interface SequenceCard {
  letter: string;
  pattern: number[];
}

/** Pick N unique letters; harder difficulty picks visually similar ones */
function pickLetters(count: number, difficulty: string): string[] {
  if (difficulty === 'advanced') {
    const anchor = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
    const scored = ALL_LETTERS.filter((l) => l !== anchor)
      .map((l) => ({ letter: l, sim: computeSimilarity(brailleMap[anchor], brailleMap[l]) }))
      .sort((a, b) => b.sim - a.sim);
    const pool = scored.slice(0, count * 2);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count - 1);
    return [anchor, ...shuffled.map((p) => p.letter)].sort(() => Math.random() - 0.5);
  }
  const shuffled = [...ALL_LETTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function SeqBrailleCell({ pattern }: { pattern: number[] }) {
  return <SharedBrailleCell pattern={pattern} className="seq-cell" dotClassName="seq-dot" />;
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
    const sorted = [...letters].sort();
    setCorrectOrder(sorted);

    // Scramble — ensure not already in order
    let scrambled = [...letters].sort(() => Math.random() - 0.5);
    let attempts = 0;
    while (scrambled.every((l, i) => l === sorted[i]) && letters.length > 1 && attempts < 20) {
      scrambled = [...letters].sort(() => Math.random() - 0.5);
      attempts++;
    }

    setCards(
      scrambled.map((letter) => ({
        letter,
        pattern: brailleMap[letter],
      })),
    );
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
    const perCard = currentCards.map((card, i) => card.letter === expected[i]);
    const isCorrect = perCard.every(Boolean);

    setCardResults(perCard);
    setFeedback(isCorrect);
    if (isCorrect) setScore((s) => s + 1);

    roundTimerRef.current = setTimeout(
      () => {
        const nextR = round + 1;
        setRound(nextR);
        if (nextR >= totalRounds) {
          const finalScore = isCorrect ? scoreRef.current + 1 : scoreRef.current;
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

            <p className="seq-instruction">Tap two cards to swap them. Arrange in A→Z order.</p>

            <div className="seq-cards" role="group" aria-label="Braille sequence cards">
              {cards.map((card, i) => (
                <button
                  key={card.letter}
                  className={`seq-card ${selectedIdx === i ? 'selected' : ''} ${
                    cardResults.length > 0 ? (cardResults[i] ? 'correct' : 'wrong') : ''
                  }`}
                  onClick={() => handleCardClick(i)}
                  disabled={phase !== 'playing'}
                  aria-label={`Position ${i + 1}${feedback !== null ? `: letter ${card.letter}` : ''}`}
                >
                  <SeqBrailleCell pattern={card.pattern} />
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
