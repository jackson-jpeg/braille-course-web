'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { describeCell } from '@/lib/braille/prose';
import { type SpeedMatchMode, isCorrect as isCorrectChoice, letterCell, makeRound } from '@/lib/games/speedmatch';
import type { QuestionSpec } from '@/lib/games/quiz';

type Mode = SpeedMatchMode;

function SpeedMatchBrailleCell({ letter, size, label }: { letter: string; size: 'large' | 'small'; label?: string }) {
  return (
    <BrailleCell
      cell={letterCell(letter)}
      className={`speedmatch-cell speedmatch-cell-${size}`}
      dotClassName="speedmatch-dot"
      label={label}
    />
  );
}

export default function BrailleSpeedMatch() {
  const { recordResult } = useGameProgress('speedmatch');
  const [mode, setMode] = useState<Mode>('read');
  const [spec, setSpec] = useState<QuestionSpec<string, string> | null>(null);
  const currentLetter = spec?.answer ?? '';
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
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const nextRound = useCallback(() => {
    const round = makeRound('read');
    setSpec(round.spec);
    setChoices(round.choices);
    setSelected(null);
    setIsCorrect(null);
    setLocked(false);
  }, []);

  useEffect(() => {
    nextRound();
  }, [nextRound]);

  const handleChoice = useCallback(
    (choice: string) => {
      if (locked || !spec) return;
      setLocked(true);
      setSelected(choice);
      const correct = isCorrectChoice(spec, choice);
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
    },
    [locked, spec, nextRound, recordResult],
  );

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
            onClick={() => {
              setMode('read');
            }}
            role="radio"
            aria-checked={mode === 'read'}
          >
            Read Braille
          </button>
          <button
            className={`speedmatch-mode-pill${mode === 'write' ? ' active' : ''}`}
            onClick={() => {
              setMode('write');
            }}
            role="radio"
            aria-checked={mode === 'write'}
          >
            Write Braille
          </button>
        </div>

        {/* Prompt */}
        <div className="speedmatch-prompt" aria-live="polite">
          {mode === 'read' ? (
            currentLetter && <SpeedMatchBrailleCell letter={currentLetter} size="large" label="Braille cell" />
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
              aria-label={
                mode === 'read'
                  ? `Choice ${i + 1}: letter ${choice}`
                  : `Choice ${i + 1}: braille cell, ${describeCell(letterCell(choice))}`
              }
            >
              <span className="speedmatch-choice-number">{i + 1}</span>
              {mode === 'read' ? (
                <span className="speedmatch-choice-letter">{choice}</span>
              ) : (
                <SpeedMatchBrailleCell letter={choice} size="small" />
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
