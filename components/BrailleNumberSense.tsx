'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap } from '@/lib/braille-map';
import { generateProblem, generateChoices, type MathProblem } from '@/lib/math-problems';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';

function BrailleCell({ pattern }: { pattern: number[] }) {
  return (
    <div className="numsense-cell" aria-hidden="true">
      {pattern.map((v, i) => (
        <span key={i} className={`numsense-dot ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

/** Render a number in braille: # indicator + digit cells */
function BrailleNumber({ num }: { num: number }) {
  const digits = String(num).split('');
  const numberIndicator = brailleMap['#'];
  return (
    <div className="numsense-braille-number" aria-label={`Braille number ${num}`}>
      <BrailleCell pattern={numberIndicator} />
      {digits.map((d, i) => (
        <BrailleCell key={i} pattern={brailleMap[d] || [0,0,0,0,0,0]} />
      ))}
    </div>
  );
}

/** Render operator in braille-style display */
function BrailleOperator({ op }: { op: string }) {
  return <span className="numsense-operator">{op}</span>;
}

export default function BrailleNumberSense() {
  const { difficulty, recordResult } = useGameProgress('number-sense');
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [choices, setChoices] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds] = useState(10);
  const [gameOver, setGameOver] = useState(false);
  const [locked, setLocked] = useState(false);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  // Visibility-scoped keyboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const params = getDifficultyParams('number-sense', difficulty) as {
    maxNumber: number;
    operations: string[];
  };

  const nextRound = useCallback(() => {
    const p = generateProblem(params.maxNumber, params.operations);
    const c = generateChoices(p.answer, 3);
    setProblem(p);
    setChoices(c);
    setSelected(null);
    setIsCorrect(null);
    setLocked(false);
  }, [params.maxNumber, params.operations]);

  const startGame = useCallback(() => {
    setScore(0);
    setRound(0);
    setGameOver(false);
    setTip('');
    nextRound();
  }, [nextRound]);

  useEffect(() => {
    startGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = useCallback((choice: number) => {
    if (locked || !problem) return;
    setLocked(true);
    setSelected(choice);
    const correct = choice === problem.answer;
    setIsCorrect(correct);

    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      const nextR = round + 1;
      setRound(nextR);
      if (nextR >= totalRounds) {
        const finalScore = correct ? score + 1 : score;
        setGameOver(true);
        const achievements = recordResult(finalScore >= totalRounds / 2, finalScore);
        pushAchievements(achievements);
        setTip(getRandomTip().fact);
      } else {
        nextRound();
      }
    }, correct ? 600 : 1200);
  }, [locked, problem, round, totalRounds, score, nextRound, recordResult]);

  // Keyboard support (1-4)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current || gameOver) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && choices[num - 1] !== undefined) {
        handleChoice(choices[num - 1]);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleChoice, choices, gameOver]);

  return (
    <div className="numsense-container" ref={containerRef}>
      <div className="numsense-header">
        <span className="section-label">Numbers</span>
        <h2>Number Sense</h2>
        <p>Solve math in braille</p>
      </div>

      <div className="numsense-body">
        {!gameOver && problem && (
          <>
            <div className="numsense-progress">
              <span>Round {round + 1} / {totalRounds}</span>
              <span>Score: {score}</span>
            </div>

            {/* Problem display in braille */}
            <div className="numsense-problem" aria-live="polite" aria-label={problem.display}>
              <BrailleNumber num={problem.operands[0]} />
              <BrailleOperator op={problem.operator} />
              <BrailleNumber num={problem.operands[1]} />
              <span className="numsense-equals">=</span>
              <span className="numsense-question">?</span>
            </div>

            {/* Answer choices */}
            <div className="numsense-choices" role="group" aria-label="Answer choices">
              {choices.map((choice, i) => {
                let cls = 'numsense-choice';
                if (selected !== null) {
                  if (choice === problem.answer) cls += ' correct';
                  else if (choice === selected && !isCorrect) cls += ' wrong';
                }
                return (
                  <button
                    key={`${choice}-${i}`}
                    className={cls}
                    onClick={() => handleChoice(choice)}
                    disabled={locked}
                    aria-label={`Choice ${i + 1}: ${choice}`}
                  >
                    <span className="numsense-choice-number">{i + 1}</span>
                    <BrailleNumber num={choice} />
                    <span className="numsense-choice-value">{choice}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {gameOver && (
          <div className="numsense-result">
            <div className="numsense-result-score">{score} / {totalRounds}</div>
            <div className="numsense-result-label">
              {score === totalRounds ? 'Perfect!' : score >= 7 ? 'Great job!' : score >= 5 ? 'Good effort!' : 'Keep practicing!'}
            </div>
            {tip && <p className="numsense-tip">{tip}</p>}
            <button className="numsense-play-again" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
