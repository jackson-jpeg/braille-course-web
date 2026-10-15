'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrailleCell from '@/components/BrailleCell';
import {
  type SprintDifficulty,
  type SprintQuestion,
  type SprintQuestionKind,
  TIME_LIMITS,
  isCorrect as isCorrectChoice,
  nextQuestion as pickQuestion,
} from '@/lib/games/contraction-sprint';
import { describeCells } from '@/lib/braille/prose';
import { useGameProgress } from '@/hooks/useGameProgress';
import DifficultySelector from '@/components/DifficultySelector';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';

/* ── Types ─────────────────────────────────────────────── */

type Phase = 'ready' | 'playing' | 'result';

/* ── Question labels ───────────────────────────────────── */

const KIND_LABELS: Record<SprintQuestionKind, string> = {
  recognition: 'What does this cell stand for in contracted braille?',
  recall: 'Find the cell for this contraction',
  application: 'Which contraction does this word use in contracted braille?',
};

const BEGINNER_RECOGNITION = 'Standing alone, this cell is the word…';

/* ── Main Component ────────────────────────────────────── */

export default function BrailleContractionSprint() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('contraction-sprint');

  const [phase, setPhase] = useState<Phase>('ready');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [question, setQuestion] = useState<SprintQuestion | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeFlash, setTimeFlash] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const scoreRef = useRef(score);
  const recentIdsRef = useRef<string[]>([]);
  const level = difficulty as SprintDifficulty;

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

  const nextQuestion = useCallback(() => {
    const q = pickQuestion(level, recentIdsRef.current);

    // Track recent to prevent repeats
    recentIdsRef.current.push(q.spec.id);
    if (recentIdsRef.current.length > 3) recentIdsRef.current.shift();

    setQuestion(q);
    setFeedback(null);
    setSelectedIndex(null);
    setTimeFlash(null);
  }, [level]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    const timeLimit = TIME_LIMITS[level];
    setPhase('playing');
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(timeLimit);
    recentIdsRef.current = [];
    nextQuestion();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [level, nextQuestion]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  // Record result + clear feedback timeout on phase transition to result
  useEffect(() => {
    if (phase === 'result') {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      const s = scoreRef.current;
      const achievements = recordResult(s >= 5, s);
      pushAchievements(achievements);
      setTip(getRandomTip().fact);
    }
  }, [phase, recordResult]);

  const handleChoice = useCallback(
    (choiceIndex: number) => {
      if (phase !== 'playing' || !question || feedback) return;

      setSelectedIndex(choiceIndex);
      const isCorrect = isCorrectChoice(question.spec, question.choices[choiceIndex]);

      if (isCorrect) {
        setFeedback('correct');
        setScore((s) => s + 1);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
        // +2s time bonus
        setTimeLeft((t) => t + 2);
        setTimeFlash('+2s');
        setFlashKey((k) => k + 1);
        flashTimerRef.current = setTimeout(() => setTimeFlash(null), 600);
        feedbackTimerRef.current = setTimeout(() => nextQuestion(), 300);
      } else {
        setFeedback('wrong');
        setStreak(0);
        // -3s time penalty
        setTimeLeft((t) => {
          const next = t - 3;
          if (next <= 0) {
            clearInterval(timerRef.current);
            // Delay phase transition slightly so user sees the wrong feedback
            setTimeout(() => setPhase('result'), 600);
            return 0;
          }
          return next;
        });
        setTimeFlash('-3s');
        setFlashKey((k) => k + 1);
        flashTimerRef.current = setTimeout(() => setTimeFlash(null), 800);
        feedbackTimerRef.current = setTimeout(() => nextQuestion(), 800);
      }
    },
    [phase, question, feedback, nextQuestion],
  );

  // Keyboard support (1-4)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4) {
        handleChoice(num - 1);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleChoice]);

  // Timer bar percentage
  const timeLimit = TIME_LIMITS[level];
  const timerPct = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const timerLow = timeLeft <= 10;

  function revealText(q: SprintQuestion): string {
    const answer = q.spec.answer;
    if (q.spec.prompt.kind === 'recall') return `${q.spec.prompt.text} is ${answer.label}`;
    if (q.spec.prompt.kind === 'application') {
      const pieces = q.spec.prompt.word!.pieces.map((p) => p.print).join(' + ');
      return `${answer.label} (${pieces})`;
    }
    return answer.label;
  }

  function getChoiceClass(index: number): string {
    if (selectedIndex === null || !question) return '';
    if (index === question.correctIndex) return 'csprint-correct';
    if (index === selectedIndex && feedback === 'wrong') return 'csprint-wrong';
    return '';
  }

  return (
    <div className="csprint-container" ref={containerRef}>
      <div className="csprint-header">
        <span className="section-label">Grade 2</span>
        <h2>Contraction Sprint</h2>
        <p>Rapid-fire contraction quiz</p>
        <DifficultySelector gameId="contraction-sprint" current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="csprint-body">
        {phase === 'ready' && (
          <div className="csprint-ready">
            <p className="csprint-instructions">
              Identify braille contractions as fast as you can. Correct answers add time; wrong answers cost time. Keys
              1–4 to choose.
            </p>
            <button className="csprint-start-btn" onClick={startGame}>
              Start Sprint
            </button>
          </div>
        )}

        {phase === 'playing' && question && (
          <>
            {/* Timer bar */}
            <div className={`csprint-timer-bar${timerLow ? ' low' : ''}`}>
              <div
                className={`csprint-timer-fill${timerLow ? ' low' : ''}${timeFlash ? ' jumped' : ''}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>

            {/* Status row: timer / score / streak */}
            <div className="csprint-status" aria-live="polite" aria-atomic="true">
              <span className={`csprint-timer${timerLow ? ' low' : ''}`}>{timeLeft}s</span>
              {timeFlash && (
                <span
                  key={flashKey}
                  className={`csprint-time-flash ${timeFlash.startsWith('+') ? 'bonus' : 'penalty'}`}
                >
                  {timeFlash}
                </span>
              )}
              <span className="csprint-score">Score: {score}</span>
              <span className="csprint-streak-inline">Streak: {streak}</span>
            </div>

            {/* Prompt */}
            <div className="csprint-prompt">
              <span className="csprint-question-label">
                {question.spec.prompt.kind === 'recognition' && level === 'beginner'
                  ? BEGINNER_RECOGNITION
                  : KIND_LABELS[question.spec.prompt.kind]}
              </span>
              {question.spec.prompt.kind === 'recognition' && question.spec.prompt.cell ? (
                <BrailleCell
                  cell={question.spec.prompt.cell}
                  className="csprint-cell csprint-cell-large"
                  dotClassName="csprint-dot"
                  label="Contraction cell"
                />
              ) : (
                <span className="csprint-prompt-text">{question.spec.prompt.text}</span>
              )}
            </div>

            {/* 2×2 choices */}
            <div className="csprint-choices" role="group" aria-label="Answer choices">
              {question.choices.map((choice, i) => (
                <button
                  key={`${choice.key}-${i}`}
                  className={`csprint-choice ${getChoiceClass(i)}`}
                  onClick={() => handleChoice(i)}
                  disabled={feedback !== null}
                  aria-label={`Choice ${i + 1}: ${choice.label}`}
                >
                  <span className="csprint-choice-number">{i + 1}</span>
                  {choice.cell ? (
                    <BrailleCell
                      cell={choice.cell}
                      className="csprint-cell csprint-cell-small"
                      dotClassName="csprint-dot"
                    />
                  ) : (
                    <span className="csprint-choice-label">{choice.label}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Show correct answer on wrong */}
            {feedback === 'wrong' && question && (
              <div className="csprint-answer-reveal" aria-live="polite">
                Correct: <strong>{revealText(question)}</strong>
                {question.spec.prompt.word && (
                  <span
                    className="csprint-reveal-word"
                    role="img"
                    aria-label={`${question.spec.prompt.word.word} in contracted braille: ${describeCells(question.spec.prompt.word.cells)}`}
                  >
                    {' '}
                    {question.spec.prompt.word.cells.map((c, j) => (
                      <BrailleCell
                        key={j}
                        cell={c}
                        className="csprint-cell csprint-cell-small"
                        dotClassName="csprint-dot"
                      />
                    ))}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {phase === 'result' && (
          <div className="csprint-result" aria-live="polite">
            <div className="csprint-result-score">{score}</div>
            <div className="csprint-result-label">
              {score === 0 ? 'Keep practicing!' : score < 5 ? 'Good effort!' : score < 10 ? 'Great job!' : 'Amazing!'}
            </div>
            <div className="csprint-result-streaks">
              <div className="csprint-result-streak-item">
                <span className="csprint-result-streak-value">{bestStreak}</span>
                <span className="csprint-result-streak-label">Best Streak</span>
              </div>
            </div>
            {tip && <p className="csprint-tip">{tip}</p>}
            <button className="csprint-start-btn" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
