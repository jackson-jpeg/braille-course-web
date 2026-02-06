'use client';

import { useState, useEffect, useCallback } from 'react';
import { brailleMap, dotDescription } from '@/lib/braille-map';
import { answerWords, validGuesses } from '@/lib/wordle-words';

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

function BrailleCell({ letter, small = false }: { letter: string; small?: boolean }) {
  const pattern = brailleMap[letter.toUpperCase()] || [0, 0, 0, 0, 0, 0];
  const prefix = small ? 'key' : 'tile';
  return (
    <div className={`${prefix}-braille`}>
      {pattern.map((v, i) => (
        <span key={i} className={`${prefix}-dot ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

const KEY_STATUS_PRIORITY: Record<KeyStatus, number> = {
  unused: 0,
  absent: 1,
  present: 2,
  correct: 3,
};

export default function BrailleWordle() {
  const [answer, setAnswer] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, KeyStatus>>({});
  const [shakeRow, setShakeRow] = useState<number | null>(null);

  // Pick a word on mount
  useEffect(() => {
    setAnswer(pickWord());
  }, []);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver || !answer) return;

      if (key === 'BACK') {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (key === 'ENTER') {
        if (currentGuess.length !== COLS) return;

        if (!validGuesses.has(currentGuess)) {
          // Invalid word: shake the current row
          setShakeRow(currentRow);
          setTimeout(() => setShakeRow(null), 500);
          return;
        }

        const statuses = computeStatuses(currentGuess, answer);

        // Update key statuses (correct > present > absent priority)
        setKeyStatuses((prev) => {
          const next = { ...prev };
          for (let i = 0; i < COLS; i++) {
            const letter = currentGuess[i];
            const newStatus = statuses[i] as KeyStatus;
            const currentStatus = next[letter] || 'unused';
            if (KEY_STATUS_PRIORITY[newStatus] > KEY_STATUS_PRIORITY[currentStatus]) {
              next[letter] = newStatus;
            }
          }
          return next;
        });

        const newGuesses = [...guesses, currentGuess];
        setGuesses(newGuesses);

        const isWin = currentGuess === answer;
        const isLastRow = currentRow === ROWS - 1;

        if (isWin) {
          setWon(true);
          setGameOver(true);
        } else if (isLastRow) {
          setGameOver(true);
        }

        setCurrentGuess('');
        setCurrentRow((prev) => prev + 1);
        return;
      }

      // Letter key
      if (/^[A-Z]$/.test(key) && currentGuess.length < COLS) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [answer, currentGuess, currentRow, gameOver, guesses]
  );

  // Physical keyboard listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
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
  }

  // Build the tile grid
  function getTileData(row: number, col: number): { letter: string; status: TileStatus } {
    if (row < guesses.length) {
      // Submitted row
      const letter = guesses[row][col];
      const statuses = computeStatuses(guesses[row], answer);
      return { letter, status: statuses[col] };
    }
    if (row === currentRow) {
      // Current input row
      const letter = currentGuess[col] || '';
      return { letter, status: letter ? 'active' : 'empty' };
    }
    // Future row
    return { letter: '', status: 'empty' };
  }

  return (
    <section className="wordle-section">
      <div className="wordle-inner">
        <div className="wordle-header">
          <span className="section-label">Practice</span>
          <h2>Braille Wordle</h2>
          <p>Guess the 4-letter word</p>
        </div>

        <div className="wordle-board" role="grid" aria-label="Game board">
          {Array.from({ length: ROWS }).map((_, row) => (
            <div
              key={row}
              className={`wordle-row${shakeRow === row ? ' shake' : ''}`}
            >
              {Array.from({ length: COLS }).map((_, col) => {
                const { letter, status } = getTileData(row, col);
                return (
                  <div key={col} className={`wordle-tile ${status}`}>
                    {letter ? (
                      <>
                        <BrailleCell letter={letter} />
                        <span className="tile-letter">{letter}</span>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="wordle-keyboard">
          {KB_ROWS.map((rowKeys, ri) => (
            <div key={ri} className="wordle-kb-row">
              {rowKeys.map((key) => {
                const isSpecial = key === 'ENTER' || key === 'BACK';
                const ks = !isSpecial ? (keyStatuses[key] || 'unused') : 'unused';
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
                    className={`wordle-key${wideClass}${statusClass}`}
                    onClick={() => handleKey(key)}
                    aria-label={ariaLabel}
                  >
                    {!isSpecial && <BrailleCell letter={key} small />}
                    <span className="key-letter">
                      {key === 'BACK' ? '⌫' : key}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {gameOver && (
          <>
            <div className="wordle-message">
              {won
                ? 'Great job! You found the word!'
                : `The word was ${answer}.`}
            </div>
            <button className="wordle-play-again" onClick={resetGame}>
              Play Again
            </button>
          </>
        )}
      </div>
    </section>
  );
}
