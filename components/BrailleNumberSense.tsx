'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  type MathProblem,
  OPERATOR_SIGNS,
  choicesFor,
  isCorrect as isCorrectAnswer,
  randomProblem,
} from '@/lib/games/number-sense';
import BrailleText from '@/components/BrailleText';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import DifficultySelector from '@/components/DifficultySelector';

const OPERATOR_WORDS = { '+': 'plus', '−': 'minus', '×': 'times' } as const;

/** A number or problem in UEB braille, drawn with the shared cell styles of this game. */
function BrailleMath({ text, label }: { text: string; label: string }) {
  return (
    <BrailleText
      text={text}
      label={label}
      className="numsense-braille-number"
      cellClassName="numsense-cell"
      dotClassName="numsense-dot"
    />
  );
}

export default function BrailleNumberSense() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('number-sense');
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
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(score);
  scoreRef.current = score;

  // Visibility-scoped keyboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nextRound = useCallback(() => {
    const p = randomProblem(difficulty);
    setProblem(p);
    setChoices(choicesFor(p));
    setSelected(null);
    setIsCorrect(null);
    setLocked(false);
  }, [difficulty]);

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

  const handleChoice = useCallback(
    (choice: number) => {
      if (locked || !problem) return;
      setLocked(true);
      setSelected(choice);
      const correct = isCorrectAnswer(problem, choice);
      setIsCorrect(correct);

      if (correct) setScore((s) => s + 1);

      roundTimerRef.current = setTimeout(
        () => {
          const nextR = round + 1;
          setRound(nextR);
          if (nextR >= totalRounds) {
            const finalScore = correct ? scoreRef.current + 1 : scoreRef.current;
            setGameOver(true);
            const achievements = recordResult(finalScore >= totalRounds / 2, finalScore);
            pushAchievements(achievements);
            setTip(getRandomTip().fact);
          } else {
            nextRound();
          }
        },
        correct ? 600 : 1200,
      );
    },
    [locked, problem, round, totalRounds, nextRound, recordResult],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

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
        <p>
          Solve math written in braille <span className="numsense-badge">UEB math signs</span>{' '}
          <span className="numsense-kbd-hint">Keys 1–4 to answer</span>
        </p>
        <DifficultySelector gameId="number-sense" current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="numsense-body">
        {!gameOver && problem && (
          <>
            <div className="numsense-progress">
              <span>
                Round {round + 1} / {totalRounds}
              </span>
              <span>Score: {score}</span>
            </div>

            {/* Problem display in UEB braille (numeric indicator + a–j, UEB plus/minus/times/equals) */}
            <div className="numsense-problem" aria-live="polite">
              <BrailleMath
                text={problem.print}
                label={`${problem.a} ${OPERATOR_WORDS[problem.operator]} ${problem.b} equals what? The ${OPERATOR_SIGNS[problem.operator].name} and equals sign are each two cells.`}
              />
              <span className="numsense-answer-blank" aria-hidden="true" />
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
                    <BrailleMath text={String(choice)} label={`${choice} in braille`} />
                    <span className="numsense-choice-value">{choice}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {gameOver && (
          <div className="numsense-result">
            <div className="numsense-result-score">
              {score} / {totalRounds}
            </div>
            <div className="numsense-result-label">
              {score === totalRounds
                ? 'Perfect!'
                : score >= 7
                  ? 'Great job!'
                  : score >= 5
                    ? 'Good effort!'
                    : 'Keep practicing!'}
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
