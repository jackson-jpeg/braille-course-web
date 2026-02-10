'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap } from '@/lib/braille-map';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';

const LETTERS = Object.keys(brailleMap).filter((k) => /^[A-Z]$/.test(k));

type Phase = 'ready' | 'show' | 'input' | 'feedback' | 'result';

export default function BrailleReflexDots() {
  const { difficulty, recordResult } = useGameProgress('reflex-dots');
  const [phase, setPhase] = useState<Phase>('ready');
  const [targetLetter, setTargetLetter] = useState('');
  const [targetPattern, setTargetPattern] = useState<number[]>([0,0,0,0,0,0]);
  const [userPattern, setUserPattern] = useState<number[]>([0,0,0,0,0,0]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const params = getDifficultyParams('reflex-dots', difficulty) as {
    displayTime: number;
    rounds: number;
  };

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

  const startRound = useCallback(() => {
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const pattern = brailleMap[letter];
    setTargetLetter(letter);
    setTargetPattern(pattern);
    setUserPattern([0,0,0,0,0,0]);
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
    };
  }, []);

  const toggleDot = useCallback((index: number) => {
    if (phase !== 'input') return;
    setUserPattern((prev) => {
      const next = [...prev];
      next[index] = next[index] ? 0 : 1;
      return next;
    });
  }, [phase]);

  const submitAnswer = useCallback(() => {
    if (phase !== 'input') return;

    const correct = userPattern.every((v, i) => v === targetPattern[i]);
    setIsCorrect(correct);
    setPhase('feedback');

    if (correct) setScore((s) => s + 1);

    setTimeout(() => {
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= params.rounds) {
        const finalScore = correct ? score + 1 : score;
        setPhase('result');
        const achievements = recordResult(finalScore >= params.rounds / 2, finalScore);
        pushAchievements(achievements);
        setTip(getRandomTip().fact);
      } else {
        startRound();
      }
    }, 800);
  }, [phase, userPattern, targetPattern, round, params.rounds, score, startRound, recordResult]);

  // Keyboard: 1-6 to toggle dots, Enter to submit
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (phase === 'input') {
        // Dot positions: keys 1-6 map to dots 1,4,2,5,3,6 (grid order)
        const dotKeyMap: Record<string, number> = {
          '1': 0, '4': 1, '2': 2, '5': 3, '3': 4, '6': 5,
        };
        if (e.key in dotKeyMap) {
          toggleDot(dotKeyMap[e.key]);
        }
        if (e.key === 'Enter') {
          submitAnswer();
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, toggleDot, submitAnswer]);

  // Dot number labels for the grid (standard braille numbering)
  const dotNumbers = [1, 4, 2, 5, 3, 6];

  return (
    <div className="reflex-container" ref={containerRef}>
      <div className="reflex-header">
        <span className="section-label">Arcade</span>
        <h2>Reflex Dots</h2>
        <p>Memorize and recreate braille patterns</p>
      </div>

      <div className="reflex-body">
        {phase === 'ready' && (
          <div className="reflex-ready">
            <p className="reflex-instructions">
              A braille pattern will flash briefly. Tap the dots to recreate it from memory!
            </p>
            <button className="reflex-start-btn" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}

        {(phase === 'show' || phase === 'input' || phase === 'feedback') && (
          <>
            <div className="reflex-status">
              <span>Round {round + 1} / {params.rounds}</span>
              <span>Score: {score}</span>
            </div>

            {/* Show phase: display the target pattern */}
            {phase === 'show' && (
              <div className="reflex-display" aria-label={`Remember this pattern for letter ${targetLetter}`}>
                <div className="reflex-flash-label">Memorize!</div>
                <div className="reflex-grid reflex-grid-show">
                  {targetPattern.map((v, i) => (
                    <span key={i} className={`reflex-dot-display ${v ? 'filled' : 'empty'}`}>
                      {v ? '●' : '○'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Input phase: user taps dots */}
            {phase === 'input' && (
              <div className="reflex-input" aria-label="Tap dots to recreate the pattern">
                <div className="reflex-prompt-text">Recreate the pattern!</div>
                <div className="reflex-grid reflex-grid-input" role="group">
                  {userPattern.map((v, i) => (
                    <button
                      key={i}
                      className={`reflex-dot-btn ${v ? 'active' : ''}`}
                      onClick={() => toggleDot(i)}
                      aria-label={`Dot ${dotNumbers[i]}: ${v ? 'raised' : 'flat'}`}
                      aria-pressed={!!v}
                    >
                      <span className="reflex-dot-num">{dotNumbers[i]}</span>
                      {v ? '●' : '○'}
                    </button>
                  ))}
                </div>
                <button className="reflex-submit-btn" onClick={submitAnswer}>
                  Check
                </button>
              </div>
            )}

            {/* Feedback phase */}
            {phase === 'feedback' && (
              <div className={`reflex-feedback ${isCorrect ? 'correct' : 'wrong'}`}>
                <div className="reflex-feedback-icon">{isCorrect ? '✓' : '✗'}</div>
                <div className="reflex-feedback-text">
                  {isCorrect ? 'Correct!' : `That was "${targetLetter}"`}
                </div>
                {!isCorrect && (
                  <div className="reflex-correct-pattern">
                    <div className="reflex-grid reflex-grid-show">
                      {targetPattern.map((v, i) => (
                        <span key={i} className={`reflex-dot-display ${v ? 'filled' : 'empty'}`}>
                          {v ? '●' : '○'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {phase === 'result' && (
          <div className="reflex-result">
            <div className="reflex-result-score">{score} / {params.rounds}</div>
            <div className="reflex-result-label">
              {score === params.rounds ? 'Perfect reflexes!' : score >= params.rounds * 0.7 ? 'Sharp memory!' : score >= params.rounds * 0.5 ? 'Good effort!' : 'Keep practicing!'}
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
