'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import DifficultySelector from '@/components/DifficultySelector';
import BrailleCell from '@/components/BrailleCell';
import BrailleDotPad, { toggleDot as toggleCellDot } from '@/components/BrailleDotPad';
import { type Cell, type Dot } from '@/lib/braille/ueb';
import { describeCell } from '@/lib/braille/prose';
import { cellDiff, dotForKey, isCorrect as isCorrectCell, pickLetter, reflexCell } from '@/lib/games/reflex';

type Phase = 'ready' | 'show' | 'input' | 'feedback' | 'result';

export default function BrailleReflexDots() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('reflex-dots');
  const [phase, setPhase] = useState<Phase>('ready');
  const [targetLetter, setTargetLetter] = useState('');
  const [userCell, setUserCell] = useState<Cell>([]);
  const targetCell: Cell = targetLetter ? reflexCell(targetLetter) : [];
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const roundTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(score);
  scoreRef.current = score;

  const params = getDifficultyParams('reflex-dots', difficulty) as {
    displayTime: number;
    rounds: number;
  };

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

  const startRound = useCallback(() => {
    const letter = pickLetter();
    setTargetLetter(letter);
    setUserCell([]);
    setIsCorrect(null);
    setPhase('show');

    // Show the pattern briefly, then hide
    showTimeoutRef.current = setTimeout(() => {
      setPhase('input');
    }, params.displayTime);
  }, [params.displayTime]);

  const startGame = useCallback(() => {
    setScore(0);
    setRound(0);
    setTip('');
    startRound();
  }, [startRound]);

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, []);

  const toggleDot = useCallback(
    (dot: Dot) => {
      if (phase !== 'input') return;
      setUserCell((prev) => toggleCellDot(prev, dot));
    },
    [phase],
  );

  const submitAnswer = useCallback(() => {
    if (phase !== 'input') return;

    const correct = isCorrectCell(userCell, targetLetter);
    setIsCorrect(correct);
    setPhase('feedback');

    if (correct) setScore((s) => s + 1);

    roundTimerRef.current = setTimeout(
      () => {
        const nextRound = round + 1;
        setRound(nextRound);
        if (nextRound >= params.rounds) {
          const finalScore = scoreRef.current; // already includes this round (re-rendered before the timeout)
          setPhase('result');
          const achievements = recordResult(finalScore >= params.rounds / 2, finalScore);
          pushAchievements(achievements);
          setTip(getRandomTip().fact);
        } else {
          startRound();
        }
      },
      correct ? 800 : 1200,
    );
  }, [phase, userCell, targetLetter, round, params.rounds, startRound, recordResult]);

  // Keyboard: 1-6 to toggle dots, Enter to submit
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (phase === 'input') {
        // Number key n toggles dot n.
        const dot = dotForKey(e.key);
        if (dot !== null) toggleDot(dot);
        if (e.key === 'Enter') {
          submitAnswer();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, toggleDot, submitAnswer]);

  const diff = cellDiff(userCell, targetCell);

  return (
    <div className="reflex-container" ref={containerRef}>
      <div className="reflex-header">
        <span className="section-label">Arcade</span>
        <h2>Reflex Dots</h2>
        <p>Memorize and recreate braille patterns</p>
        <DifficultySelector gameId="reflex-dots" current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="reflex-body">
        {phase === 'ready' && (
          <div className="reflex-ready">
            <p className="reflex-instructions">
              A braille pattern will flash briefly. Tap the dots to recreate it from memory!
              <span className="reflex-kbd-hint">Keyboard: number keys 1–6 toggle those dots, Enter to submit</span>
            </p>
            <button className="reflex-start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {(phase === 'show' || phase === 'input' || phase === 'feedback') && (
          <>
            <div className="reflex-status" aria-live="polite" aria-atomic="true">
              <span>
                Round {round + 1} / {params.rounds}
              </span>
              <span>Score: {score}</span>
            </div>

            {/* Show phase: display the target pattern */}
            {phase === 'show' && (
              <div className="reflex-display">
                <div className="reflex-flash-label">
                  Memorize: <span className="reflex-letter-badge">{targetLetter}</span>
                </div>
                <BrailleCell
                  cell={targetCell}
                  className="reflex-grid reflex-grid-show"
                  dotClassName="reflex-dot-display"
                  label={`Remember this cell for letter ${targetLetter}`}
                />
              </div>
            )}

            {/* Input phase: user taps dots */}
            {phase === 'input' && (
              <div className="reflex-input">
                <div className="reflex-prompt-text">
                  Recreate: <span className="reflex-letter-badge">{targetLetter}</span>
                </div>
                <BrailleDotPad
                  cell={userCell}
                  onToggle={toggleDot}
                  className="reflex-grid reflex-grid-input"
                  dotClassName="reflex-dot-btn"
                  raisedClassName="active"
                  label={`Dots for letter ${targetLetter}`}
                  renderDot={(dot, raised) => (
                    <>
                      <span className="reflex-dot-num" aria-hidden="true">
                        {dot}
                      </span>
                      <span aria-hidden="true">{raised ? '●' : '○'}</span>
                    </>
                  )}
                />
                <button className="reflex-submit-btn" onClick={submitAnswer}>
                  Check
                </button>
              </div>
            )}

            {/* Feedback phase */}
            {phase === 'feedback' && (
              <div className={`reflex-feedback ${isCorrect ? 'correct' : 'wrong'}`} aria-live="assertive">
                <div className="reflex-feedback-icon">{isCorrect ? '✓' : '✗'}</div>
                <div className="reflex-feedback-text">
                  {isCorrect ? (
                    <>
                      Correct! That&apos;s <span className="reflex-letter-badge">{targetLetter}</span>
                    </>
                  ) : (
                    <>
                      That was <span className="reflex-letter-badge">{targetLetter}</span>
                    </>
                  )}
                </div>
                {!isCorrect && (
                  <div className="reflex-comparison" role="group" aria-label="Pattern comparison">
                    <div className="reflex-comparison-col">
                      <div className="reflex-comparison-label">Your answer</div>
                      <BrailleCell
                        cell={userCell}
                        className="reflex-grid reflex-grid-show"
                        dotClassName="reflex-dot-display"
                        label="Your answer"
                      />
                    </div>
                    <div className="reflex-comparison-col">
                      <div className="reflex-comparison-label">Correct</div>
                      <BrailleCell
                        cell={targetCell}
                        className="reflex-grid reflex-grid-show"
                        dotClassName="reflex-dot-display"
                        label={`Correct, letter ${targetLetter}`}
                      />
                    </div>
                  </div>
                )}
                {!isCorrect && (
                  <p className="reflex-comparison-label">
                    {diff.missing.length > 0 && <>Missing: {describeCell(diff.missing)}. </>}
                    {diff.extra.length > 0 && <>Not part of it: {describeCell(diff.extra)}.</>}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {phase === 'result' && (
          <div className="reflex-result">
            <div className="reflex-result-score">
              {score} / {params.rounds}
            </div>
            <div className="reflex-result-label">
              {score === params.rounds
                ? 'Perfect reflexes!'
                : score >= params.rounds * 0.7
                  ? 'Sharp memory!'
                  : score >= params.rounds * 0.5
                    ? 'Good effort!'
                    : 'Keep practicing!'}
            </div>
            {tip && <p className="reflex-tip">{tip}</p>}
            <button className="reflex-start-btn" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
