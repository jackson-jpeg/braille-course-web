'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BrailleCell from '@/components/BrailleCell';
import { describeCell } from '@/lib/braille/prose';
import {
  type KeyStatus,
  type TileScore,
  MAX_GUESSES,
  WORD_LENGTH,
  isValidGuess,
  keyToLetter,
  pickAnswer,
  scoreGuess,
  tileCell,
  updateKeyStatuses,
} from '@/lib/games/wordgame';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';
import { getRandomTip } from '@/lib/learning-tips';

type TileStatus = 'empty' | 'active' | TileScore;

const ROWS = MAX_GUESSES;
const COLS = WORD_LENGTH;
const KB_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['ENTER', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'BACK'],
];

function WordGameBrailleCell({ letter, small = false }: { letter: string; small?: boolean }) {
  const prefix = small ? 'key' : 'tile';
  return <BrailleCell cell={tileCell(letter)} className={`${prefix}-braille`} dotClassName={`${prefix}-dot`} />;
}

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
    setAnswer(pickAnswer());
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

        if (!isValidGuess(currentGuess)) {
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
          const statuses = scoreGuess(guess, answer);
          setKeyStatuses((prev) => updateKeyStatuses(prev, guess, statuses));

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
      if (/^[a-z]$/.test(key) && currentGuess.length < COLS) {
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
      } else {
        const letter = keyToLetter(k);
        if (letter) handleKey(letter);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  function resetGame() {
    setAnswer(pickAnswer());
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
      const statuses = scoreGuess(revealGuess, answer);
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
      const statuses = scoreGuess(guesses[row], answer);
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
                : `letter ${key}, ${describeCell(tileCell(key))}`;

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
