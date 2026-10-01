'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { dotDescription } from '@/lib/braille-map';
import BrailleCell from '@/components/BrailleCell';
import { answerWords, validGuesses } from '@/lib/game-words';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';

type TileStatus = 'empty' | 'active' | 'correct' | 'present' | 'absent';
type KeyStatus = 'unused' | 'correct' | 'present' | 'absent';

const ROWS = 6;
const COLS = 4;
const KB_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

function pickWord(): string {
  return answerWords[Math.floor(Math.random() * answerWords.length)];
}

function computeStatuses(guess: string, answer: string): TileStatus[] {
  const statuses: TileStatus[] = Array(COLS).fill('absent');
  const remaining = answer.split('');

  // First pass: mark correct positions
  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answer[i]) {
      statuses[i] = 'correct';
      remaining[i] = '';
    }
  }

  // Second pass: mark present (right letter, wrong spot)
  for (let i = 0; i < COLS; i++) {
    if (statuses[i] === 'correct') continue;
    const idx = remaining.indexOf(guess[i]);
    if (idx !== -1) {
      statuses[i] = 'present';
      remaining[idx] = '';
    }
  }

  return statuses;
}

function WordGameBrailleCell({ letter, small = false }: { letter: string; small?: boolean }) {
  const prefix = small ? 'key' : 'tile';
  return <BrailleCell letter={letter} className={`${prefix}-braille`} dotClassName={`${prefix}-dot`} />;
}

const KEY_STATUS_PRIORITY: Record<KeyStatus, number> = {
  unused: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

const FLIP_DURATION = 500; // ms per tile flip
const FLIP_STAGGER = 250; // ms between each tile starting

export default function BrailleWordGame() {
  const { recordResult } = useGameProgress('wordgame');
  const [answer, setAnswer] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [tip, setTip] = useState('');

  // Animation state
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [revealGuess, setRevealGuess] = useState<string | null>(null);
  const [popTile, setPopTile] = useState<string | null>(null); // "row-col"
  const [winBounce, setWinBounce] = useState(false);

  // Timer cleanup to prevent state updates after unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scheduleTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  // Visibility-scoped keyboard: only capture keys when this section is visible
  const sectionRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const el = sectionRef.current;
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

  // Cleanup all scheduled timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Pick a word on mount
  useEffect(() => {
    setAnswer(pickWord());
  }, []);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver || !answer || revealingRow !== null) return;

      if (key === 'BACK') {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (key === 'ENTER') {
        if (currentGuess.length !== COLS) return;

        if (!validGuesses.has(currentGuess)) {
          setShakeRow(currentRow);
          scheduleTimeout(() => setShakeRow(null), 500);
          return;
        }

        // Start reveal animation
        const row = currentRow;
        const guess = currentGuess;
        setRevealingRow(row);
        setRevealGuess(guess);
        setCurrentGuess('');
        setCurrentRow((prev) => prev + 1);

        // After all tiles have flipped, finalize
        const totalRevealTime = FLIP_STAGGER * (COLS - 1) + FLIP_DURATION;
        scheduleTimeout(() => {
          const statuses = computeStatuses(guess, answer);

          // Update key statuses
          setKeyStatuses((prev) => {
            const next = { ...prev };
            for (let i = 0; i < COLS; i++) {
              const letter = guess[i];
              const newStatus = statuses[i] as KeyStatus;
              const currentStatus = next[letter] || 'unused';
              if (KEY_STATUS_PRIORITY[newStatus] > KEY_STATUS_PRIORITY[currentStatus]) {
                next[letter] = newStatus;
              }
            }
            return next;
          });

          setGuesses((prev) => [...prev, guess]);
          setRevealingRow(null);
          setRevealGuess(null);

          const isWin = guess === answer;
          const isLastRow = row === ROWS - 1;

          if (isWin) {
            setWon(true);
            setGameOver(true);
            setWinBounce(true);
            setTip(getRandomTip().fact);
            // Score: higher is better (ROWS + 1 - guesses used)
            const score = ROWS + 1 - (row + 1);
            const achievements = recordResult(true, score);
            pushAchievements(achievements);
          } else if (isLastRow) {
            setGameOver(true);
            setTip(getRandomTip().fact);
            const achievements = recordResult(false, 0);
            pushAchievements(achievements);
          }
        }, totalRevealTime);

        return;
      }

      // Letter key
      if (/^[A-Z]$/.test(key) && currentGuess.length < COLS) {
        const col = currentGuess.length;
        setPopTile(`${currentRow}-${col}`);
        scheduleTimeout(() => setPopTile(null), 150);
        setCurrentGuess((prev) => prev + key);
      }
    },
    [answer, currentGuess, currentRow, gameOver, revealingRow, recordResult, scheduleTimeout],
  );

  // Physical keyboard listener (only when this game section is visible)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === 'Enter') {
        handleKey('ENTER');
      } else if (k === 'Backspace') {
        handleKey('BACK');
      } else if (/^[a-zA-Z]$/.test(k)) {
        handleKey(k.toUpperCase());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  function resetGame() {
    setAnswer(pickWord());
    setGuesses([]);
    setCurrentGuess('');
    setCurrentRow(0);
    setGameOver(false);
    setWon(false);
    setKeyStatuses({});
    setShakeRow(null);
    setRevealingRow(null);
    setRevealGuess(null);
    setPopTile(null);
    setWinBounce(false);
    setTip('');
  }

  // Build the tile grid
  function getTileData(
    row: number,
    col: number,
  ): {
    letter: string;
    status: TileStatus;
    revealing: boolean;
    revealIndex: number;
    isWinBounce: boolean;
  } {
    // Currently revealing row — show the guess letters but status is still 'active' visually
    // CSS handles the flip + color change via data-status
    if (revealingRow === row && revealGuess) {
      const letter = revealGuess[col] || '';
      const statuses = computeStatuses(revealGuess, answer);
      return {
        letter,
        status: statuses[col],
        revealing: true,
        revealIndex: col,
        isWinBounce: false,
      };
    }

    if (row < guesses.length) {
      // Submitted row
      const letter = guesses[row][col];
      const statuses = computeStatuses(guesses[row], answer);
      const isLastGuess = row === guesses.length - 1;
      return {
        letter,
        status: statuses[col],
        revealing: false,
        revealIndex: -1,
        isWinBounce: winBounce && won && isLastGuess,
      };
    }

    if (row === currentRow) {
      // Current input row
      const letter = currentGuess[col] || '';
      return {
        letter,
        status: letter ? 'active' : 'empty',
        revealing: false,
        revealIndex: -1,
        isWinBounce: false,
      };
    }

    // Future row
    return { letter: '', status: 'empty', revealing: false, revealIndex: -1, isWinBounce: false };
  }

  return (
    <div className="wordgame-inner" ref={sectionRef}>
      <div className="wordgame-header">
        <span className="section-label">Practice</span>
        <h2>Braille Word Game</h2>
        <p>Guess the 4-letter word</p>
      </div>

      <div className="wordgame-board" role="grid" aria-label="Game board">
        {Array.from({ length: ROWS }).map((_, row) => (
          <div key={row} className={`wordgame-row${shakeRow === row ? ' shake' : ''}`}>
            {Array.from({ length: COLS }).map((_, col) => {
              const { letter, status, revealing, revealIndex, isWinBounce } = getTileData(row, col);
              const isPop = popTile === `${row}-${col}`;

              const tileClasses = [
                'wordgame-tile',
                revealing ? 'revealing' : status,
                isPop ? 'pop' : '',
                isWinBounce ? 'win-bounce' : '',
              ]
                .filter(Boolean)
                .join(' ');

              const style: Record<string, string> = {};
              if (revealing) {
                style['--reveal-delay'] = `${revealIndex * FLIP_STAGGER}ms`;
              }
              if (isWinBounce) {
                style['--bounce-delay'] = `${col * 100}ms`;
              }

              return (
                <div key={col} className={tileClasses} data-status={revealing ? status : undefined} style={style}>
                  {letter ? (
                    <>
                      <WordGameBrailleCell letter={letter} />
                      <span className="tile-letter">{letter}</span>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="wordgame-keyboard">
        {KB_ROWS.map((rowKeys, ri) => (
          <div key={ri} className="wordgame-kb-row">
            {rowKeys.map((key) => {
              const isSpecial = key === 'ENTER' || key === 'BACK';
              const ks = !isSpecial ? keyStatuses[key] || 'unused' : 'unused';
              const statusClass = ks !== 'unused' ? ` ${ks}` : '';
              const wideClass = isSpecial ? ' wide' : '';

              const ariaLabel = isSpecial
                ? key === 'ENTER'
                  ? 'Enter'
                  : 'Backspace'
                : `Letter ${key}, Braille ${dotDescription(key)}`;

              return (
                <button
                  key={key}
                  className={`wordgame-key${wideClass}${statusClass}`}
                  onClick={() => handleKey(key)}
                  disabled={gameOver}
                  aria-label={ariaLabel}
                >
                  {!isSpecial && <WordGameBrailleCell letter={key} small />}
                  <span className="key-letter">{key === 'BACK' ? '⌫' : key}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="wordgame-result" aria-live="polite">
          <div className="wordgame-message">{won ? 'Great job! You found the word!' : `The word was ${answer}.`}</div>
          {tip && <p className="wordgame-tip">{tip}</p>}
          <button className="wordgame-play-again" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
