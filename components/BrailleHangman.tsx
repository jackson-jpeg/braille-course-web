'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { brailleMap, dotDescription } from '@/lib/braille-map';
import { hangmanWords } from '@/lib/hangman-words';
import { useGameProgress } from '@/hooks/useGameProgress';
import { pushAchievements } from '@/components/AchievementToast';

const MAX_WRONG = 6;

const KB_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

function pickWord(): string {
  return hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
}

function BrailleCell({ letter }: { letter: string }) {
  const pattern = brailleMap[letter.toUpperCase()] || [0, 0, 0, 0, 0, 0];
  return (
    <div className="hangman-key-braille">
      {pattern.map((v, i) => (
        <span key={i} className={`hangman-key-dot ${v ? 'filled' : 'empty'}`} />
      ))}
    </div>
  );
}

function HangmanSvg({ wrongCount }: { wrongCount: number }) {
  return (
    <svg
      className="hangman-figure"
      viewBox="0 0 200 200"
      aria-label={`Hangman: ${wrongCount} of ${MAX_WRONG} wrong guesses`}
    >
      {/* Gallows - always visible */}
      <line x1="40" y1="180" x2="160" y2="180" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="180" x2="60" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="20" x2="130" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="130" y1="20" x2="130" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      {/* Head */}
      {wrongCount >= 1 && (
        <circle cx="130" cy="55" r="15" fill="none" stroke="currentColor" strokeWidth="3" />
      )}
      {/* Body */}
      {wrongCount >= 2 && (
        <line x1="130" y1="70" x2="130" y2="120" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Left arm */}
      {wrongCount >= 3 && (
        <line x1="130" y1="85" x2="105" y2="105" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Right arm */}
      {wrongCount >= 4 && (
        <line x1="130" y1="85" x2="155" y2="105" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Left leg */}
      {wrongCount >= 5 && (
        <line x1="130" y1="120" x2="108" y2="150" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      )}
      {/* Right leg */}
      {wrongCount >= 6 && (
        <line x1="130" y1="120" x2="152" y2="150" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function BrailleHangman() {
  const { recordResult } = useGameProgress('hangman');
  const [answer, setAnswer] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Visibility-scoped keyboard: only capture keys when this section is visible
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(true);

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

  useEffect(() => {
    setAnswer(pickWord());
  }, []);

  const wrongGuesses = [...guessedLetters].filter(
    (l) => !answer.includes(l)
  );
  const wrongCount = wrongGuesses.length;

  const isWon = answer
    ? answer.split('').every((l) => guessedLetters.has(l))
    : false;
  const isLost = wrongCount >= MAX_WRONG;

  // Check win/loss after render
  useEffect(() => {
    if (!answer) return;
    if (isWon && !gameOver) {
      setWon(true);
      setGameOver(true);
      // Score: MAX_WRONG - wrongCount (higher = fewer wrong guesses)
      const achievements = recordResult(true, MAX_WRONG - wrongCount);
      pushAchievements(achievements);
    } else if (isLost && !gameOver) {
      setGameOver(true);
      const achievements = recordResult(false, 0);
      pushAchievements(achievements);
    }
  }, [isWon, isLost, gameOver, answer, wrongCount, recordResult]);

  const handleGuess = useCallback(
    (letter: string) => {
      if (gameOver || !answer || guessedLetters.has(letter)) return;
      setGuessedLetters((prev) => new Set([...prev, letter]));
    },
    [gameOver, answer, guessedLetters]
  );

  // Physical keyboard support (only when this game section is visible)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!visibleRef.current) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) {
        handleGuess(e.key.toUpperCase());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleGuess]);

  function resetGame() {
    setAnswer(pickWord());
    setGuessedLetters(new Set());
    setGameOver(false);
    setWon(false);
  }

  function getLetterStatus(letter: string): 'unused' | 'correct' | 'wrong' {
    if (!guessedLetters.has(letter)) return 'unused';
    return answer.includes(letter) ? 'correct' : 'wrong';
  }

  return (
    <div className="hangman-container" ref={containerRef}>
      <div className="hangman-header">
        <span className="section-label">Challenge</span>
        <h2>Braille Hangman</h2>
        <p>Guess the word — 6 wrong guesses allowed</p>
      </div>

      <div className="hangman-body">
        <HangmanSvg wrongCount={wrongCount} />

        <div className="hangman-word" aria-label="Word to guess" aria-live="polite">
          {answer.split('').map((letter, i) => {
            const revealed = guessedLetters.has(letter);
            return (
              <div key={i} className={`hangman-letter-slot${revealed ? ' revealed' : ''}`}>
                {revealed ? (
                  <>
                    <div className="hangman-slot-braille">
                      {brailleMap[letter]?.map((v, di) => (
                        <span key={di} className={`hangman-slot-dot ${v ? 'filled' : 'empty'}`} />
                      ))}
                    </div>
                    <span className="hangman-slot-letter">{letter}</span>
                  </>
                ) : (
                  <span className="hangman-slot-blank">_</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="hangman-wrong-count">
          {wrongCount} / {MAX_WRONG} wrong
        </div>

        <div className="hangman-keyboard">
          {KB_ROWS.map((rowKeys, ri) => (
            <div key={ri} className="hangman-kb-row">
              {rowKeys.map((key) => {
                const status = getLetterStatus(key);
                return (
                  <button
                    key={key}
                    className={`hangman-key${status !== 'unused' ? ` ${status}` : ''}`}
                    onClick={() => handleGuess(key)}
                    disabled={status !== 'unused' || gameOver}
                    aria-label={`Letter ${key}, Braille ${dotDescription(key)}`}
                  >
                    <BrailleCell letter={key} />
                    <span className="hangman-key-letter">{key}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {gameOver && (
          <>
            <div className="hangman-message">
              {won
                ? 'You saved the stick figure!'
                : `The word was ${answer}.`}
            </div>
            <button className="hangman-play-again" onClick={resetGame}>
              Play Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
