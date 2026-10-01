'use client';

import '@/styles/games/word-game.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import { Results, sample, useAnnouncer, useGameKeys, useSession } from '@/components/games/kit';
import { LETTERS, describe } from '@/lib/ueb';
import { answerWords, validGuesses } from '@/lib/game-words';
import { getRandomTip } from '@/lib/learning-tips';

type Status = 'correct' | 'present' | 'absent';

const ROWS = 6;
const COLS = 4;
const KB_ROWS = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), ['enter', ...'zxcvbnm'.split(''), 'back']];
const STAGGER = 220;
const RANK: Record<Status, number> = { absent: 1, present: 2, correct: 3 };
const STATUS_TEXT: Record<Status, string> = {
  correct: 'right spot',
  present: 'in the word, wrong spot',
  absent: 'not in the word',
};
const STATUS_MARK: Record<Status, string> = { correct: '✓', present: '↔', absent: '–' };

function computeStatuses(guess: string, answer: string): Status[] {
  const out: Status[] = Array(COLS).fill('absent');
  const rest = answer.split('');
  for (let i = 0; i < COLS; i++) {
    if (guess[i] === answer[i]) {
      out[i] = 'correct';
      rest[i] = '';
    }
  }
  for (let i = 0; i < COLS; i++) {
    if (out[i] === 'correct') continue;
    const j = rest.indexOf(guess[i]);
    if (j !== -1) {
      out[i] = 'present';
      rest[j] = '';
    }
  }
  return out;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const pickWord = () => sample(answerWords).toLowerCase();

export default function BrailleWordGame() {
  const { stats, finish } = useSession('wordgame');
  const { announce, region } = useAnnouncer();
  const [answer, setAnswer] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [revealed, setRevealed] = useState(COLS); // tiles shown in the newest row
  const [message, setMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [over, setOver] = useState<null | { won: boolean; best: number; isNewBest: boolean; tip: string }>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(() => {
    setAnswer(pickWord());
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const revealing = revealed < COLS;

  const keyStatus: Record<string, Status> = {};
  guesses.forEach((g, r) => {
    const st = computeStatuses(g, answer);
    for (let i = 0; i < COLS; i++) {
      if (r === guesses.length - 1 && i >= revealed) continue;
      const prev = keyStatus[g[i]];
      if (!prev || RANK[st[i]] > RANK[prev]) keyStatus[g[i]] = st[i];
    }
  });

  const submit = useCallback(() => {
    if (current.length < COLS) {
      setMessage(`Type ${COLS} letters first.`);
      announce(`Not enough letters. Type ${COLS} letters first.`);
      return;
    }
    if (!validGuesses.has(current.toUpperCase())) {
      setMessage(`“${current}” is not in the word list.`);
      announce(`${current.split('').join(' ')} is not in the word list. Try another word.`);
      setShake(true);
      later(() => setShake(false), 450);
      return;
    }
    const guess = current;
    const row = guesses.length;
    const statuses = computeStatuses(guess, answer);
    setGuesses((g) => [...g, guess]);
    setCurrent('');
    setMessage('');

    const step = prefersReducedMotion() ? 0 : STAGGER;
    setRevealed(step ? 0 : COLS);
    for (let i = 1; i <= COLS && step; i++) later(() => setRevealed(i), i * step);

    later(
      () => {
        const won = guess === answer;
        const summary = guess
          .split('')
          .map((l, i) => `${l} ${STATUS_TEXT[statuses[i]]}`)
          .join(', ');
        if (won || row === ROWS - 1) {
          const score = won ? ROWS - row : 0;
          const prevBest = stats.bestScore;
          finish(won, score);
          setOver({
            won,
            best: Math.max(prevBest, score),
            isNewBest: won && score > prevBest,
            tip: getRandomTip().fact,
          });
          announce(
            won ? `${summary}. You found it in ${row + 1}!` : `${summary}. Out of guesses. The word was ${answer}.`,
          );
        } else {
          announce(`Guess ${row + 1}: ${summary}. ${ROWS - row - 1} guesses left.`);
        }
      },
      COLS * step + 50,
    );
  }, [announce, answer, current, finish, guesses.length, later, stats.bestScore]);

  const press = useCallback(
    (key: string) => {
      if (over || !answer || revealing) return;
      if (key === 'enter') submit();
      else if (key === 'back') setCurrent((c) => c.slice(0, -1));
      else if (/^[a-z]$/.test(key) && current.length < COLS) {
        setCurrent((c) => (c.length < COLS ? c + key : c));
        setMessage('');
        announce(`${key}, ${describe(LETTERS[key])}`);
      }
    },
    [announce, answer, current.length, over, revealing, submit],
  );

  useGameKeys((e) => {
    // Enter / Space on a focused on-screen key: let the button's own click handle it.
    const onButton = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
    if (e.key === 'Enter') {
      if (onButton) return;
      e.preventDefault();
      if (over) restart();
      else press('enter');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      press('back');
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      press(e.key.toLowerCase());
    }
  });

  function restart() {
    timers.current.forEach(clearTimeout);
    setAnswer(pickWord());
    setGuesses([]);
    setCurrent('');
    setRevealed(COLS);
    setMessage('');
    setOver(null);
    announce('New word. Type your first guess.');
  }

  const rows = Array.from({ length: ROWS }, (_, r) => {
    if (r < guesses.length) return { word: guesses[r], statuses: computeStatuses(guesses[r], answer), state: 'done' };
    if (r === guesses.length && !over) return { word: current, statuses: null, state: 'current' };
    return { word: '', statuses: null, state: 'empty' };
  });

  return (
    <div className="game-board wg" data-testid="game-board">
      {region}
      <div className="game-board-toolbar">
        <h2 className="wg-title">Guess the {COLS}-letter word</h2>
        <span className="wg-count">
          Guess {Math.min(guesses.length + 1, ROWS)} of {ROWS}
        </span>
      </div>

      <ol className="wg-board" aria-label="Your guesses">
        {rows.map((row, r) => {
          const isNewest = r === guesses.length - 1;
          let sr = '';
          if (row.state === 'done' && row.statuses && (!isNewest || !revealing)) {
            sr = row.word
              .split('')
              .map((l, i) => `${l}: ${STATUS_TEXT[row.statuses![i]]}`)
              .join('; ');
          } else if (row.state === 'current') {
            sr = row.word ? `Typing: ${row.word.split('').join(' ')}` : 'Empty — type a word';
          }
          return (
            <li key={r} className={`wg-row${row.state === 'current' && shake ? ' is-shaking' : ''}`}>
              <span className="sr-only">{`Row ${r + 1}: ${sr || 'empty'}`}</span>
              {Array.from({ length: COLS }, (_, c) => {
                const letter = row.word[c] ?? '';
                const shown = row.statuses && (!isNewest || c < revealed);
                const st = shown ? row.statuses![c] : null;
                return (
                  <span
                    key={c}
                    aria-hidden="true"
                    className={`wg-tile${letter ? ' has-letter' : ''}${st ? ` is-${st}` : ''}${
                      row.state === 'current' && c === row.word.length ? ' is-next' : ''
                    }`}
                  >
                    {letter && (
                      <>
                        <Cell dots={LETTERS[letter]} size="sm" tone={st && st !== 'absent' ? 'ink' : 'tomato'} />
                        <span className="wg-tile-letter">{letter}</span>
                      </>
                    )}
                    {st && <span className="wg-mark">{STATUS_MARK[st]}</span>}
                  </span>
                );
              })}
            </li>
          );
        })}
      </ol>

      <p className="wg-message" aria-hidden="true">
        {message}
      </p>

      <p className="wg-legend">
        <span>
          <span className="wg-swatch is-correct">✓</span> right spot
        </span>
        <span>
          <span className="wg-swatch is-present">↔</span> wrong spot
        </span>
        <span>
          <span className="wg-swatch is-absent">–</span> not in word
        </span>
      </p>

      {!over && (
        <div className="wg-keyboard" role="group" aria-label="On-screen keyboard">
          {KB_ROWS.map((keys, i) => (
            <div key={i} className="wg-kb-row">
              {keys.map((k) => {
                const special = k === 'enter' || k === 'back';
                const st = special ? undefined : keyStatus[k];
                const name =
                  k === 'enter' ? 'Enter' : k === 'back' ? 'Delete letter' : `${k}${st ? `, ${STATUS_TEXT[st]}` : ''}`;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`wg-key${special ? ' wg-key--wide' : ''}${st ? ` is-${st}` : ''}`}
                    onClick={() => press(k)}
                    aria-label={name}
                  >
                    {special ? (
                      <span className="wg-key-text" aria-hidden="true">
                        {k === 'enter' ? 'Enter' : '⌫'}
                      </span>
                    ) : (
                      <>
                        <Cell dots={LETTERS[k]} size="xs" />
                        <span className="wg-key-text">{k}</span>
                      </>
                    )}
                    {st && (
                      <span className="wg-key-mark" aria-hidden="true">
                        {STATUS_MARK[st]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {over && (
        <Results
          title={over.won ? 'You found the word!' : 'So close!'}
          summary={
            over.won
              ? `“${answer}” in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}.`
              : `The word was “${answer}”.`
          }
          stars={over.won ? (guesses.length <= 3 ? 3 : guesses.length <= 5 ? 2 : 1) : 0}
          best={`${over.best} points`}
          isNewBest={over.isNewBest}
          onReplay={restart}
          replayLabel="New word"
        >
          <BrailleText
            text={answer}
            size="md"
            label={`${answer} in braille: ${answer
              .split('')
              .map((l) => describe(LETTERS[l]))
              .join(', then ')}`}
          />
          {over.tip && <p className="wg-tip">{over.tip}</p>}
        </Results>
      )}
    </div>
  );
}
