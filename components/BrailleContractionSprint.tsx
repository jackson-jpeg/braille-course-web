'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  contractedBrailleEntries,
  type ContractionEntry,
  type ContractionType,
} from '@/lib/contracted-braille-map';
import { getContractionWords, type ContractionWord } from '@/lib/contraction-words';
import { computeSimilarity } from '@/lib/braille-map';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';

/* ── Types ─────────────────────────────────────────────── */

type Phase = 'ready' | 'playing' | 'result';
type QuestionKind = 'recognition' | 'recall' | 'application';

interface Question {
  kind: QuestionKind;
  /** What the user sees as the prompt */
  promptLabel: string;
  /** Braille dots shown in the prompt (recognition only) */
  promptPattern?: number[];
  /** The 4 choices */
  choices: Choice[];
  /** Index of correct choice (0-3) */
  correctIndex: number;
}

interface Choice {
  label: string;
  pattern?: number[]; // recall choices show braille
}

/* ── Helpers ───────────────────────────────────────────── */

const BEGINNER_TYPES: ContractionType[] = ['wordsign'];
const ALL_TYPES: ContractionType[] = ['wordsign', 'strong', 'groupsign-strong', 'groupsign-lower', 'wordsign-lower'];

function getPool(difficulty: 'beginner' | 'intermediate' | 'advanced'): ContractionEntry[] {
  const types = difficulty === 'beginner' ? BEGINNER_TYPES : ALL_TYPES;
  return contractedBrailleEntries.filter((e) => types.includes(e.type));
}

/** Clean label: "en (enough)" → "en" */
function cleanLabel(label: string): string {
  return label.split('(')[0].trim();
}

function pickDistractors(correct: ContractionEntry, pool: ContractionEntry[]): ContractionEntry[] {
  const candidates = pool.filter((e) => e.label !== correct.label);

  // Score by similarity, take top 8, pick 3
  const scored = candidates.map((e) => ({
    entry: e,
    sim: computeSimilarity(correct.pattern, e.pattern),
  }));
  scored.sort((a, b) => b.sim - a.sim);

  let topPool = scored.slice(0, 8);

  // Fall back to broader pool if not enough same-type entries
  if (topPool.length < 3) {
    const broader = contractedBrailleEntries
      .filter((e) => e.label !== correct.label)
      .map((e) => ({ entry: e, sim: computeSimilarity(correct.pattern, e.pattern) }));
    broader.sort((a, b) => b.sim - a.sim);
    topPool = broader.slice(0, 8);
  }

  // Shuffle and pick 3
  const shuffled = [...topPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((s) => s.entry);
}

function generateRecognition(pool: ContractionEntry[]): Question {
  const correct = pool[Math.floor(Math.random() * pool.length)];
  const distractors = pickDistractors(correct, pool);
  const allChoices = [correct, ...distractors].sort(() => Math.random() - 0.5);
  const correctIndex = allChoices.indexOf(correct);

  return {
    kind: 'recognition',
    promptLabel: 'What contraction is this?',
    promptPattern: correct.pattern,
    choices: allChoices.map((e) => ({ label: cleanLabel(e.label) })),
    correctIndex,
  };
}

function generateRecall(pool: ContractionEntry[]): Question {
  const correct = pool[Math.floor(Math.random() * pool.length)];
  const distractors = pickDistractors(correct, pool);
  const allChoices = [correct, ...distractors].sort(() => Math.random() - 0.5);
  const correctIndex = allChoices.indexOf(correct);

  return {
    kind: 'recall',
    promptLabel: cleanLabel(correct.label),
    choices: allChoices.map((e) => ({ label: cleanLabel(e.label), pattern: e.pattern })),
    correctIndex,
  };
}

function generateApplication(pool: ContractionEntry[], words: ContractionWord[]): Question | null {
  // Only use multi-piece words
  const eligible = words.filter((w) => w.pieces.length > 1);
  if (eligible.length === 0) return null;

  const word = eligible[Math.floor(Math.random() * eligible.length)];

  // Find the contraction pieces (not single letters)
  const contractionPieces = word.pieces.filter(
    (p) => !(p.length === 1 && /^[A-Z]$/.test(p))
  );
  if (contractionPieces.length === 0) return null;

  const targetPiece = contractionPieces[Math.floor(Math.random() * contractionPieces.length)];
  const correctEntry = contractedBrailleEntries.find(
    (e) => cleanLabel(e.label).toLowerCase() === targetPiece.toLowerCase()
  );
  if (!correctEntry) return null;

  const distractors = pickDistractors(correctEntry, pool);
  const allChoices = [correctEntry, ...distractors].sort(() => Math.random() - 0.5);
  const correctIndex = allChoices.indexOf(correctEntry);

  return {
    kind: 'application',
    promptLabel: word.word,
    choices: allChoices.map((e) => ({ label: cleanLabel(e.label) })),
    correctIndex,
  };
}

function generateQuestion(
  pool: ContractionEntry[],
  words: ContractionWord[],
  difficulty: 'beginner' | 'intermediate' | 'advanced',
): Question {
  const roll = Math.random();
  let kind: QuestionKind;

  if (difficulty === 'beginner') {
    // 50/50 recognition/recall, no application
    kind = roll < 0.5 ? 'recognition' : 'recall';
  } else if (difficulty === 'intermediate') {
    // 35/35/30
    kind = roll < 0.35 ? 'recognition' : roll < 0.70 ? 'recall' : 'application';
  } else {
    // 30/30/40
    kind = roll < 0.30 ? 'recognition' : roll < 0.60 ? 'recall' : 'application';
  }

  if (kind === 'recognition') return generateRecognition(pool);
  if (kind === 'recall') return generateRecall(pool);

  // Application — may fail if no eligible words
  const q = generateApplication(pool, words);
  if (q) return q;
  // Fallback to recognition
  return generateRecognition(pool);
}

/* ── BrailleCell sub-component ─────────────────────────── */

function BrailleCell({ pattern, size = 'medium' }: { pattern: number[]; size?: 'small' | 'medium' | 'large' }) {
  return (
    <div className={`csprint-cell csprint-cell-${size}`} aria-hidden="true">
      {pattern.map((v, i) => (
        <span key={i} className={`csprint-dot ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

/* ── Question labels ───────────────────────────────────── */

const KIND_LABELS: Record<QuestionKind, string> = {
  recognition: 'Read this braille contraction',
  recall: 'Find the braille for this contraction',
  application: 'Which contraction is in this word?',
};

/* ── Main Component ────────────────────────────────────── */

export default function BrailleContractionSprint() {
  const { difficulty, recordResult } = useGameProgress('contraction-sprint');

  const [phase, setPhase] = useState<Phase>('ready');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
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
  const recentCorrectRef = useRef<string[]>([]);
  const poolRef = useRef<ContractionEntry[]>([]);
  const wordsRef = useRef<ContractionWord[]>([]);

  scoreRef.current = score;

  // Visibility-scoped keyboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Load pool and words based on difficulty
  useEffect(() => {
    poolRef.current = getPool(difficulty);
    wordsRef.current = getContractionWords(difficulty);
  }, [difficulty]);

  const nextQuestion = useCallback(() => {
    const pool = poolRef.current;
    const words = wordsRef.current;
    if (pool.length === 0) return;

    let q: Question;
    let attempts = 0;
    do {
      q = generateQuestion(pool, words, difficulty);
      attempts++;
    } while (
      attempts < 10 &&
      recentCorrectRef.current.includes(q.choices[q.correctIndex].label)
    );

    // Track recent to prevent repeats
    recentCorrectRef.current.push(q.choices[q.correctIndex].label);
    if (recentCorrectRef.current.length > 3) recentCorrectRef.current.shift();

    setQuestion(q);
    setFeedback(null);
    setSelectedIndex(null);
    setTimeFlash(null);
  }, [difficulty]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

    const timeLimit = difficulty === 'beginner' ? 60 : difficulty === 'intermediate' ? 45 : 30;
    setPhase('playing');
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTimeLeft(timeLimit);
    recentCorrectRef.current = [];
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
  }, [difficulty, nextQuestion]);

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

  const handleChoice = useCallback((choiceIndex: number) => {
    if (phase !== 'playing' || !question || feedback) return;

    setSelectedIndex(choiceIndex);
    const isCorrect = choiceIndex === question.correctIndex;

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
  }, [phase, question, feedback, nextQuestion]);

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
  const timeLimit = difficulty === 'beginner' ? 60 : difficulty === 'intermediate' ? 45 : 30;
  const timerPct = Math.max(0, Math.min(100, (timeLeft / timeLimit) * 100));
  const timerLow = timeLeft <= 10;

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
      </div>

      <div className="csprint-body">
        {phase === 'ready' && (
          <div className="csprint-ready">
            <p className="csprint-instructions">
              Identify braille contractions as fast as you can.
              Correct answers add time — wrong answers cost time.
              Keys 1–4 to choose.
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
              <span className={`csprint-timer${timerLow ? ' low' : ''}`}>
                {timeLeft}s
              </span>
              {timeFlash && (
                <span
                  key={flashKey}
                  className={`csprint-time-flash ${timeFlash.startsWith('+') ? 'bonus' : 'penalty'}`}
                >
                  {timeFlash}
                </span>
              )}
              <span className="csprint-score">Score: {score}</span>
              <span className="csprint-streak-inline">
                Streak: {streak}
              </span>
            </div>

            {/* Prompt */}
            <div className="csprint-prompt">
              <span className="csprint-question-label">{KIND_LABELS[question.kind]}</span>
              {question.kind === 'recognition' && question.promptPattern ? (
                <BrailleCell pattern={question.promptPattern} size="large" />
              ) : (
                <span className="csprint-prompt-text">{question.promptLabel}</span>
              )}
            </div>

            {/* 2×2 choices */}
            <div className="csprint-choices" role="group" aria-label="Answer choices">
              {question.choices.map((choice, i) => (
                <button
                  key={`${choice.label}-${i}`}
                  className={`csprint-choice ${getChoiceClass(i)}`}
                  onClick={() => handleChoice(i)}
                  disabled={feedback !== null}
                  aria-label={`Choice ${i + 1}: ${choice.label}`}
                >
                  <span className="csprint-choice-number">{i + 1}</span>
                  {choice.pattern ? (
                    <BrailleCell pattern={choice.pattern} size="small" />
                  ) : (
                    <span className="csprint-choice-label">{choice.label}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Show correct answer on wrong */}
            {feedback === 'wrong' && question && (
              <div className="csprint-answer-reveal" aria-live="polite">
                Correct: <strong>{question.choices[question.correctIndex].label}</strong>
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
