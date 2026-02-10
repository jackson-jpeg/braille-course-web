'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap, computeSimilarity } from '@/lib/braille-map';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';

const LETTERS = Object.keys(brailleMap).filter((k) => /^[A-Z]$/.test(k));

type Mode = 'read' | 'write';

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getDistractors(correct: string, mode: Mode): string[] {
  const correctPattern = brailleMap[correct];
  // Score all other letters by similarity
  const scored = LETTERS
    .filter((l) => l !== correct)
    .map((l) => ({ letter: l, sim: computeSimilarity(correctPattern, brailleMap[l]) }))
    .sort((a, b) => b.sim - a.sim);

  // Take top 8 most similar, pick 3 randomly from that pool
  const pool = scored.slice(0, 8);
  return pickRandom(pool, 3).map((p) => p.letter);
}

function BrailleCell({ pattern, size }: { pattern: number[]; size: 'large' | 'small' }) {
  return (
    <div className={`speedmatch-cell speedmatch-cell-${size}`} aria-hidden="true">
      {pattern.map((v, i) => (
        <span key={i} className={`speedmatch-dot ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

export default function BrailleSpeedMatch() {
  const { recordResult } = useGameProgress('speedmatch');
  const [mode, setMode] = useState<Mode>('read');
  const [currentLetter, setCurrentLetter] = useState('');
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [locked, setLocked] = useState(false);

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

  const nextRound = useCallback(() => {
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const distractors = getDistractors(letter, mode);
    const allChoices = [letter, ...distractors].sort(() => Math.random() - 0.5);
    setCurrentLetter(letter);
    setChoices(allChoices);
    setSelected(null);
    setIsCorrect(null);
    setLocked(false);
  }, [mode]);

  useEffect(() => {
    nextRound();
  }, [nextRound]);

  const handleChoice = useCallback((choice: string) => {
    if (locked) return;
    setLocked(true);
    setSelected(choice);
    const correct = choice === currentLetter;
    setIsCorrect(correct);

    if (correct) {
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        // Record each correct answer with current streak as score
        const achievements = recordResult(true, next);
        pushAchievements(achievements);
        return next;
      });
      setTimeout(nextRound, 600);
    } else {
      setStreak(0);
      recordResult(false, 0);
      setTimeout(nextRound, 1500);
    }
  }, [locked, currentLetter, nextRound, recordResult]);

  // Keyboard support (1-4)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 4 && choices[num - 1]) {
        handleChoice(choices[num - 1]);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleChoice, choices]);

  function getChoiceClass(choice: string): string {
    if (selected === null) return '';
    if (choice === currentLetter) return 'speedmatch-correct';
    if (choice === selected && !isCorrect) return 'speedmatch-wrong';
    return '';
  }

  const pattern = brailleMap[currentLetter] || [0, 0, 0, 0, 0, 0];

  return (
    <div className="speedmatch-container" ref={containerRef}>
      <div className="speedmatch-header">
        <span className="section-label">Quiz</span>
        <h2>Speed Match</h2>
        <p>Test your braille letter recognition</p>
      </div>

      <div className="speedmatch-body">
        {/* Mode toggle */}
        <div className="speedmatch-mode-toggle" role="radiogroup" aria-label="Game mode">
          <button
            className={`speedmatch-mode-pill${mode === 'read' ? ' active' : ''}`}
            onClick={() => { setMode('read'); }}
            role="radio"
            aria-checked={mode === 'read'}
          >
            Read Braille
          </button>
          <button
            className={`speedmatch-mode-pill${mode === 'write' ? ' active' : ''}`}
            onClick={() => { setMode('write'); }}
            role="radio"
            aria-checked={mode === 'write'}
          >
            Write Braille
          </button>
        </div>

        {/* Prompt */}
        <div className="speedmatch-prompt" aria-live="polite">
          {mode === 'read' ? (
            <BrailleCell pattern={pattern} size="large" />
          ) : (
            <div className="speedmatch-prompt-letter">{currentLetter}</div>
          )}
        </div>

        {/* Choices */}
        <div className="speedmatch-choices" role="group" aria-label="Answer choices">
          {choices.map((choice, i) => (
            <button
              key={`${choice}-${i}`}
              className={`speedmatch-choice ${getChoiceClass(choice)}`}
              onClick={() => handleChoice(choice)}
              disabled={locked}
              aria-label={mode === 'read'
                ? `Choice ${i + 1}: ${choice}`
                : `Choice ${i + 1}: braille pattern for ${choice}`
              }
            >
              <span className="speedmatch-choice-number">{i + 1}</span>
              {mode === 'read' ? (
                <span className="speedmatch-choice-letter">{choice}</span>
              ) : (
                <BrailleCell pattern={brailleMap[choice]} size="small" />
              )}
            </button>
          ))}
        </div>

        {/* Streak display */}
        <div className="speedmatch-streak" aria-live="polite" aria-atomic="true">
          <div className="speedmatch-streak-current">
            <span className="speedmatch-streak-value">{streak}</span>
            <span className="speedmatch-streak-label">Streak</span>
          </div>
          <div className="speedmatch-streak-best">
            <span className="speedmatch-streak-value">{bestStreak}</span>
            <span className="speedmatch-streak-label">Best</span>
          </div>
        </div>
      </div>
    </div>
  );
}
