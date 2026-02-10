'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap, computeSimilarity } from '@/lib/braille-map';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';

const ALL_LETTERS = Object.keys(brailleMap).filter((k) => /^[A-Z]$/.test(k));

type Phase = 'playing' | 'checking' | 'result';

interface SequenceCard {
  letter: string;
  pattern: number[];
  currentIndex: number; // position in the user's arrangement
}

/** Pick N letters with some similarity for harder difficulty */
function pickLetters(count: number, difficulty: string): string[] {
  if (difficulty === 'advanced') {
    // Pick one anchor, then find similar letters
    const anchor = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
    const scored = ALL_LETTERS
      .filter((l) => l !== anchor)
      .map((l) => ({ letter: l, sim: computeSimilarity(brailleMap[anchor], brailleMap[l]) }))
      .sort((a, b) => b.sim - a.sim);
    const pool = scored.slice(0, count * 2);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, count - 1);
    return [anchor, ...shuffled.map((p) => p.letter)].sort(() => Math.random() - 0.5);
  }

  // Random selection
  const shuffled = [...ALL_LETTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function BrailleCell({ pattern }: { pattern: number[] }) {
  return (
    <div className="seq-cell" aria-hidden="true">
      {pattern.map((v, i) => (
        <span key={i} className={`seq-dot ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

export default function BrailleSequence() {
  const { difficulty, recordResult } = useGameProgress('sequence');
  const [phase, setPhase] = useState<Phase>('playing');
  const [cards, setCards] = useState<SequenceCard[]>([]);
  const [correctOrder, setCorrectOrder] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalRounds] = useState(5);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const params = getDifficultyParams('sequence', difficulty) as { letterCount: number };

  const startRound = useCallback(() => {
    const letters = pickLetters(params.letterCount, difficulty);
    const sorted = [...letters].sort();
    setCorrectOrder(sorted);

    // Scramble for display
    const scrambled = [...letters].sort(() => Math.random() - 0.5);
    setCards(scrambled.map((letter, i) => ({
      letter,
      pattern: brailleMap[letter],
      currentIndex: i,
    })));
    setSelectedIdx(null);
    setFeedback(null);
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

  const handleCardClick = useCallback((index: number) => {
    if (phase !== 'playing') return;

    if (selectedIdx === null) {
      setSelectedIdx(index);
    } else if (selectedIdx === index) {
      // Deselect same card
      setSelectedIdx(null);
    } else {
      // Swap
      setCards((prev) => {
        const next = [...prev];
        const temp = next[selectedIdx];
        next[selectedIdx] = next[index];
        next[index] = temp;
        return next.map((c, i) => ({ ...c, currentIndex: i }));
      });
      setSelectedIdx(null);
    }
  }, [phase, selectedIdx]);

  const checkOrder = useCallback(() => {
    if (phase !== 'playing') return;
    setPhase('checking');

    const isCorrect = cards.every((card, i) => card.letter === correctOrder[i]);
    setFeedback(isCorrect);

    if (isCorrect) setScore((s) => s + 1);

    setTimeout(() => {
      const nextR = round + 1;
      setRound(nextR);
      if (nextR >= totalRounds) {
        const finalScore = isCorrect ? score + 1 : score;
        setPhase('result');
        const achievements = recordResult(finalScore >= totalRounds / 2, finalScore);
        pushAchievements(achievements);
        setTip(getRandomTip().fact);
      } else {
        startRound();
      }
    }, isCorrect ? 800 : 1500);
  }, [phase, cards, correctOrder, round, totalRounds, score, startRound, recordResult]);

  return (
    <div className="seq-container" ref={containerRef}>
      <div className="seq-header">
        <span className="section-label">Order</span>
        <h2>Braille Sequence</h2>
        <p>Arrange braille cells in alphabetical order</p>
      </div>

      <div className="seq-body">
        {phase !== 'result' && (
          <>
            <div className="seq-status">
              <span>Round {round + 1} / {totalRounds}</span>
              <span>Score: {score}</span>
            </div>

            <p className="seq-instruction">
              Tap two cards to swap them. Arrange in A→Z order.
            </p>

            <div className="seq-cards" role="group" aria-label="Braille sequence cards">
              {cards.map((card, i) => (
                <button
                  key={`${card.letter}-${i}`}
                  className={`seq-card ${
                    selectedIdx === i ? 'selected' : ''
                  } ${
                    feedback === true ? 'correct' : feedback === false ? 'wrong' : ''
                  }`}
                  onClick={() => handleCardClick(i)}
                  disabled={phase !== 'playing'}
                  aria-label={`Position ${i + 1}: braille pattern`}
                >
                  <BrailleCell pattern={card.pattern} />
                  {feedback !== null && (
                    <span className="seq-card-letter">{card.letter}</span>
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
              <div className={`seq-feedback ${feedback ? 'correct' : 'wrong'}`}>
                {feedback
                  ? 'Correct order!'
                  : `Correct: ${correctOrder.join(' → ')}`}
              </div>
            )}
          </>
        )}

        {phase === 'result' && (
          <div className="seq-result">
            <div className="seq-result-score">{score} / {totalRounds}</div>
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
