'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap } from '@/lib/braille-map';
import BrailleCell from '@/components/BrailleCell';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import DifficultySelector from '@/components/DifficultySelector';

const LETTERS = Object.keys(brailleMap).filter((k) => /^[A-Z]$/.test(k));
const FREE = 'FREE';
const CENTER = 12; // index of the free centre square on a 5×5 card

type Phase = 'ready' | 'playing' | 'won';

/** Build a fresh 5×5 card: 24 unique random letters + a free centre. */
function makeCard(): string[] {
  const pool = [...LETTERS].sort(() => Math.random() - 0.5).slice(0, 24);
  const card: string[] = [];
  let p = 0;
  for (let i = 0; i < 25; i++) {
    card.push(i === CENTER ? FREE : pool[p++]);
  }
  return card;
}

/** The 12 winning lines of a 5×5 grid (5 rows, 5 cols, 2 diagonals). */
const LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines;
})();

function countCompletedLines(marked: boolean[]): number {
  return LINES.filter((line) => line.every((i) => marked[i])).length;
}

export default function BrailleBingo() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('bingo');
  const params = getDifficultyParams('bingo', difficulty) as {
    winCondition: 'line' | 'double-line' | 'blackout';
    callIntervalMs: number;
  };

  const [phase, setPhase] = useState<Phase>('ready');
  const [card, setCard] = useState<string[]>(() => makeCard());
  const [marked, setMarked] = useState<boolean[]>(() => {
    const m = new Array(25).fill(false);
    m[CENTER] = true;
    return m;
  });
  const [called, setCalled] = useState<string[]>([]);
  const [currentCall, setCurrentCall] = useState<string | null>(null);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [tip, setTip] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const callTimerRef = useRef<ReturnType<typeof setInterval>>();
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const calledRef = useRef<Set<string>>(new Set());
  const cardRef = useRef<string[]>(card);
  const markedRef = useRef<boolean[]>(marked);
  cardRef.current = card;
  markedRef.current = marked;

  const winLabel =
    params.winCondition === 'line'
      ? 'a full line'
      : params.winCondition === 'double-line'
        ? 'two lines'
        : 'the whole card (blackout)';

  const hasWon = useCallback(
    (m: boolean[]): boolean => {
      if (params.winCondition === 'blackout') return m.every(Boolean);
      const lines = countCompletedLines(m);
      return params.winCondition === 'double-line' ? lines >= 2 : lines >= 1;
    },
    [params.winCondition],
  );

  const stopCaller = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
  }, []);

  // Pick the next call — biased toward unmarked card letters so games progress.
  const doCall = useCallback(() => {
    const cardLetters = cardRef.current;
    const m = markedRef.current;
    const unmarked = cardLetters.filter((l, i) => l !== FREE && !m[i] && !calledRef.current.has(l));
    let next: string;
    if (unmarked.length > 0 && Math.random() < 0.72) {
      next = unmarked[Math.floor(Math.random() * unmarked.length)];
    } else {
      const remaining = LETTERS.filter((l) => !calledRef.current.has(l));
      if (remaining.length === 0) return;
      next = remaining[Math.floor(Math.random() * remaining.length)];
    }
    calledRef.current.add(next);
    setCurrentCall(next);
    setCalled((prev) => [next, ...prev]);
  }, []);

  const startCaller = useCallback(() => {
    stopCaller();
    callTimerRef.current = setInterval(() => {
      if (visibleRef.current) doCall();
    }, params.callIntervalMs);
  }, [doCall, params.callIntervalMs, stopCaller]);

  const startGame = useCallback(() => {
    stopCaller();
    calledRef.current = new Set();
    const fresh = makeCard();
    const m = new Array(25).fill(false);
    m[CENTER] = true;
    setCard(fresh);
    setMarked(m);
    setCalled([]);
    setCurrentCall(null);
    setScore(0);
    setTip('');
    setPhase('playing');
    cardRef.current = fresh;
    markedRef.current = m;
    // First call shortly after start
    setTimeout(() => doCall(), 500);
    startCaller();
  }, [doCall, startCaller, stopCaller]);

  // Restart the caller cadence when difficulty (interval) changes mid-play
  useEffect(() => {
    if (phase === 'playing') startCaller();
    return stopCaller;
  }, [phase, startCaller, stopCaller]);

  // Visibility: pause calls while the game is scrolled off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => (visibleRef.current = entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopCaller();
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, [stopCaller]);

  const handleMark = useCallback(
    (i: number) => {
      if (phase !== 'playing') return;
      if (marked[i]) return;
      const letter = card[i];
      if (letter === FREE) return;
      if (!calledRef.current.has(letter)) {
        // Not called yet — gentle nudge, no penalty
        setShakeIdx(i);
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => setShakeIdx(null), 350);
        return;
      }
      const next = marked.slice();
      next[i] = true;
      setMarked(next);
      markedRef.current = next;

      if (hasWon(next)) {
        stopCaller();
        const callsUsed = calledRef.current.size;
        const finalScore = Math.max(5, 80 - callsUsed * 2);
        setScore(finalScore);
        setPhase('won');
        const achievements = recordResult(true, finalScore);
        pushAchievements(achievements);
        setTip(getRandomTip().fact);
      }
    },
    [phase, marked, card, hasWon, recordResult, stopCaller],
  );

  const markedCount = marked.filter(Boolean).length;

  return (
    <div className="bingo-container" ref={containerRef}>
      <div className="bingo-header">
        <span className="section-label">Listen &amp; Mark</span>
        <h2>Braille Bingo</h2>
        <p>
          A letter is called each round — tap every matching cell on your card to reach{' '}
          <span className="bingo-badge">{winLabel}</span>
        </p>
        <DifficultySelector gameId="bingo" current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="bingo-body">
        {phase === 'ready' && (
          <div className="bingo-intro">
            <p>Letters are called on a timer. Mark them on your card before you can complete {winLabel}.</p>
            <button className="bingo-start" onClick={startGame}>
              Start Bingo
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <>
            <div className="bingo-caller" aria-live="polite">
              <span className="bingo-caller-label">Now calling</span>
              {currentCall ? (
                <div className="bingo-current" aria-label={`Letter ${currentCall}`}>
                  <BrailleCell
                    letter={currentCall}
                    className="bingo-current-braille"
                    dotClassName="bingo-current-dot"
                  />
                  <span className="bingo-current-letter">{currentCall}</span>
                </div>
              ) : (
                <div className="bingo-current bingo-current-empty">…</div>
              )}
            </div>

            <div className="bingo-progress">
              <span>Marked: {markedCount} / 25</span>
              <span>Called: {called.length}</span>
            </div>

            <div className="bingo-card" role="grid" aria-label="Your bingo card">
              {card.map((letter, i) => {
                const isMarked = marked[i];
                const isFree = letter === FREE;
                let cls = 'bingo-cell';
                if (isMarked) cls += ' marked';
                if (isFree) cls += ' free';
                if (shakeIdx === i) cls += ' shake';
                return (
                  <button
                    key={i}
                    className={cls}
                    onClick={() => handleMark(i)}
                    disabled={isFree || isMarked}
                    aria-label={isFree ? 'Free space' : `${letter}${isMarked ? ', marked' : ''}`}
                  >
                    {isFree ? (
                      <span className="bingo-free-star" aria-hidden="true">
                        ★
                      </span>
                    ) : (
                      <>
                        <BrailleCell letter={letter} className="bingo-cell-braille" dotClassName="bingo-cell-dot" />
                        <span className="bingo-cell-letter">{letter}</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bingo-called-list" aria-label="Letters called so far">
              {called.slice(0, 12).map((l, i) => (
                <span key={`${l}-${i}`} className="bingo-called-chip">
                  {l}
                </span>
              ))}
            </div>
          </>
        )}

        {phase === 'won' && (
          <div className="bingo-result">
            <div className="bingo-result-title">Bingo!</div>
            <div className="bingo-result-score">{score} pts</div>
            <div className="bingo-result-label">
              You reached {winLabel} in {called.length} calls.
            </div>
            {tip && <p className="bingo-tip">{tip}</p>}
            <button className="bingo-play-again" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
