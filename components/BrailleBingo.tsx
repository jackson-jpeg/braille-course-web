'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { describeCell } from '@/lib/braille/prose';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import DifficultySelector from '@/components/DifficultySelector';
import {
  CENTER,
  FREE,
  bingoCell,
  canMark,
  hasWon as cardHasWon,
  initialMarks,
  makeCard,
  nextCall,
} from '@/lib/games/bingo';

type Phase = 'ready' | 'playing' | 'won';

export default function BrailleBingo() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('bingo');
  const params = getDifficultyParams('bingo', difficulty) as {
    winCondition: 'line' | 'double-line' | 'blackout';
    callIntervalMs: number;
  };

  const [phase, setPhase] = useState<Phase>('ready');
  const [card, setCard] = useState<string[]>(() => makeCard());
  const [marked, setMarked] = useState<boolean[]>(() => initialMarks());
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

  const hasWon = useCallback((m: boolean[]): boolean => cardHasWon(m, params.winCondition), [params.winCondition]);

  const stopCaller = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
  }, []);

  // Pick the next call — biased toward unmarked card letters so games progress.
  const doCall = useCallback(() => {
    const next = nextCall(cardRef.current, markedRef.current, calledRef.current);
    if (next === null) return;
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
    const m = initialMarks();
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
      if (!canMark(letter, calledRef.current)) {
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
                <div className="bingo-current" aria-label={`letter ${currentCall}`}>
                  <BrailleCell
                    cell={bingoCell(currentCall)}
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
                    aria-label={
                      isFree
                        ? 'Free space'
                        : isMarked
                          ? `letter ${letter}, ${describeCell(bingoCell(letter))}, marked`
                          : `braille ${describeCell(bingoCell(letter))}`
                    }
                  >
                    {isFree ? (
                      <span className="bingo-free-star" aria-hidden="true">
                        ★
                      </span>
                    ) : (
                      <>
                        <BrailleCell
                          cell={bingoCell(letter)}
                          className="bingo-cell-braille"
                          dotClassName="bingo-cell-dot"
                        />
                        {/* The print letter shows once marked: find the braille for the called letter. */}
                        <span className="bingo-cell-letter" aria-hidden="true">
                          {isMarked ? letter : '\u00a0'}
                        </span>
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
