'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap, computeSimilarity } from '@/lib/braille-map';
import BrailleCell from '@/components/BrailleCell';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';
import { getDifficultyParams } from '@/lib/difficulty-settings';
import DifficultySelector from '@/components/DifficultySelector';

const LETTERS = Object.keys(brailleMap).filter((k) => /^[A-Z]$/.test(k));
const AREA_H = 340; // play-area height in px; a cell "lands" when it passes this
const MAX_LIVES = 3;
const WIN_SCORE = 10; // a solid run — counts as a win for streaks/achievements

type Phase = 'ready' | 'playing' | 'over';
interface Drop {
  id: number;
  letter: string;
  x: number; // percent from left
  y: number; // px from top
}

/** Pick a letter, optionally biased toward one visually similar to `near`. */
function pickLetter(near: string | null, similar: boolean): string {
  if (similar && near && Math.random() < 0.5) {
    const scored = LETTERS.filter((l) => l !== near)
      .map((l) => ({ l, sim: computeSimilarity(brailleMap[near], brailleMap[l]) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 6);
    return scored[Math.floor(Math.random() * scored.length)].l;
  }
  return LETTERS[Math.floor(Math.random() * LETTERS.length)];
}

export default function BrailleRain() {
  const { difficulty, setDifficulty, recordResult } = useGameProgress('rain');
  const params = getDifficultyParams('rain', difficulty) as {
    fallSpeed: number; // px per second at score 0
    spawnMs: number;
    similarLetters: boolean;
  };

  const [phase, setPhase] = useState<Phase>('ready');
  const [drops, setDrops] = useState<Drop[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [tip, setTip] = useState('');
  const [reduced, setReduced] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);
  const dropsRef = useRef<Drop[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_LIVES);
  const lastLetterRef = useRef<string | null>(null);
  const idRef = useRef(0);
  const phaseRef = useRef<Phase>('ready');
  const rafRef = useRef<number>(0);
  const stepTimerRef = useRef<ReturnType<typeof setInterval>>();
  const spawnTimerRef = useRef<ReturnType<typeof setInterval>>();
  const flashTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const paramsRef = useRef(params);
  paramsRef.current = params;
  phaseRef.current = phase;

  const stopLoops = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
  }, []);

  // Detect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Visibility: freeze while off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => (visibleRef.current = entry.isIntersecting), {
      threshold: 0.3,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const endGame = useCallback(() => {
    const finalScore = scoreRef.current;
    stopLoops();
    setPhase('over');
    phaseRef.current = 'over';
    const achievements = recordResult(finalScore >= WIN_SCORE, finalScore);
    pushAchievements(achievements);
    setTip(getRandomTip().fact);
  }, [recordResult, stopLoops]);

  const spawn = useCallback(() => {
    const letter = pickLetter(lastLetterRef.current, paramsRef.current.similarLetters);
    lastLetterRef.current = letter;
    const drop: Drop = { id: idRef.current++, letter, x: 6 + Math.random() * 82, y: -40 };
    dropsRef.current = [...dropsRef.current, drop];
    setDrops(dropsRef.current);
  }, []);

  // Advance all drops by `dy` px; any that land cost a life.
  const advance = useCallback(
    (dy: number) => {
      let lost = 0;
      const survivors: Drop[] = [];
      for (const d of dropsRef.current) {
        const ny = d.y + dy;
        if (ny >= AREA_H) lost++;
        else survivors.push({ ...d, y: ny });
      }
      dropsRef.current = survivors;
      setDrops(survivors);
      if (lost > 0) {
        livesRef.current = Math.max(0, livesRef.current - lost);
        setLives(livesRef.current);
        if (livesRef.current <= 0) endGame();
      }
    },
    [endGame],
  );

  // Smooth (rAF) loop for normal motion
  const startSmoothLoop = useCallback(() => {
    let last = performance.now();
    let spawnAcc = 0;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (phaseRef.current === 'playing' && visibleRef.current) {
        const speed = paramsRef.current.fallSpeed * (1 + scoreRef.current * 0.02);
        advance(speed * dt);
        spawnAcc += dt * 1000;
        if (spawnAcc >= paramsRef.current.spawnMs) {
          spawnAcc = 0;
          spawn();
        }
      }
      if (phaseRef.current === 'playing') rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [advance, spawn]);

  // Discrete "step" loop for reduced-motion — cells descend in visible chunks
  const startStepLoop = useCallback(() => {
    const stepMs = 650;
    const stepPx = 46;
    stepTimerRef.current = setInterval(() => {
      if (phaseRef.current === 'playing' && visibleRef.current) advance(stepPx);
    }, stepMs);
    spawnTimerRef.current = setInterval(
      () => {
        if (phaseRef.current === 'playing' && visibleRef.current) spawn();
      },
      Math.max(1400, paramsRef.current.spawnMs),
    );
  }, [advance, spawn]);

  const startGame = useCallback(() => {
    stopLoops();
    dropsRef.current = [];
    scoreRef.current = 0;
    livesRef.current = MAX_LIVES;
    lastLetterRef.current = null;
    setDrops([]);
    setScore(0);
    setLives(MAX_LIVES);
    setTip('');
    setPhase('playing');
    phaseRef.current = 'playing';
    spawn();
    if (reduced) startStepLoop();
    else startSmoothLoop();
  }, [reduced, spawn, startSmoothLoop, startStepLoop, stopLoops]);

  // Tear down any running loop on unmount (game-over stops them via endGame)
  useEffect(() => stopLoops, [stopLoops]);

  // Keyboard: type the letter of the lowest matching drop to clear it
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current || phaseRef.current !== 'playing') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1 || !/[a-zA-Z]/.test(e.key)) return;
      const letter = e.key.toUpperCase();
      const matches = dropsRef.current.filter((d) => d.letter === letter);
      if (matches.length === 0) {
        setWrongFlash(true);
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setWrongFlash(false), 200);
        return;
      }
      // Clear the lowest (closest to landing) match
      const target = matches.reduce((a, b) => (b.y > a.y ? b : a));
      dropsRef.current = dropsRef.current.filter((d) => d.id !== target.id);
      setDrops(dropsRef.current);
      scoreRef.current += 1;
      setScore(scoreRef.current);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Cleanup flash timer
  useEffect(() => () => flashTimerRef.current && clearTimeout(flashTimerRef.current), []);

  return (
    <div className="rain-container" ref={containerRef}>
      <div className="rain-header">
        <span className="section-label">Read &amp; Type</span>
        <h2>Braille Rain</h2>
        <p>
          Braille cells fall — type each letter before it lands. <span className="rain-kbd-hint">Type A–Z</span>
        </p>
        <DifficultySelector gameId="rain" current={difficulty} onChange={setDifficulty} />
      </div>

      <div className="rain-body">
        {phase !== 'ready' && (
          <div className="rain-hud">
            <span className="rain-score">Cleared: {score}</span>
            <span className="rain-lives" aria-label={`${lives} lives remaining`}>
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <span key={i} className={`rain-life${i < lives ? '' : ' lost'}`} aria-hidden="true">
                  ♥
                </span>
              ))}
            </span>
          </div>
        )}

        {phase === 'ready' && (
          <div className="rain-intro">
            <p>Cells drop from the top. Type the matching letter to clear each one before it reaches the bottom.</p>
            {reduced && <p className="rain-reduced-note">Reduced-motion mode: cells descend in gentle steps.</p>}
            <button className="rain-start" onClick={startGame}>
              Start Rain
            </button>
          </div>
        )}

        {phase === 'playing' && (
          <div
            className={`rain-field${wrongFlash ? ' wrong' : ''}`}
            style={{ height: AREA_H }}
            role="group"
            aria-label="Falling braille cells"
          >
            {drops.map((d) => (
              <div
                key={d.id}
                className="rain-drop"
                style={{ left: `${d.x}%`, top: `${d.y}px` }}
                aria-label={`Falling letter ${d.letter}`}
              >
                <BrailleCell letter={d.letter} className="rain-drop-braille" dotClassName="rain-drop-dot" />
              </div>
            ))}
            <div className="rain-baseline" aria-hidden="true" />
          </div>
        )}

        {phase === 'over' && (
          <div className="rain-result">
            <div className="rain-result-title">{score >= WIN_SCORE ? 'Great run!' : 'Game over'}</div>
            <div className="rain-result-score">{score} cleared</div>
            {tip && <p className="rain-tip">{tip}</p>}
            <button className="rain-play-again" onClick={startGame}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
