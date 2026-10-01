'use client';

import '@/styles/games/hangman.css';
import { useCallback, useState } from 'react';
import Cell from '@/components/ui/Cell';
import {
  Hud,
  ModePicker,
  Results,
  StartPanel,
  sample,
  useAnnouncer,
  useGameKeys,
  useSession,
} from '@/components/games/kit';
import { LETTERS, describe } from '@/lib/ueb';
import { hangmanWords } from '@/lib/hangman-words';
import { DIFFICULTY_INFO, getDifficultyParams } from '@/lib/difficulty-settings';
import { getRandomTip } from '@/lib/learning-tips';
import type { Difficulty } from '@/lib/progress-types';

type Phase = 'start' | 'play' | 'done';

const LEVELS: Difficulty[] = ['beginner', 'intermediate', 'advanced'];
const KB_ROWS = ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')];
const WORDS = hangmanWords.map((w) => w.toLowerCase()).filter((w) => /^[a-z]+$/.test(w));
const LONGEST = Math.max(...WORDS.map((w) => w.length));

function levelParams(d: Difficulty) {
  const p = getDifficultyParams('hangman', d) as { minLength?: number; maxLength?: number; maxWrong?: number };
  // The word list tops out at five letters, so longer ranges fall back to the longest words available.
  const min = Math.min(p.minLength ?? 4, LONGEST);
  const max = Math.max(p.maxLength ?? 5, min);
  return { min, max, maxWrong: p.maxWrong ?? 6 };
}

function pickWord(d: Difficulty): string {
  const { min, max } = levelParams(d);
  const pool = WORDS.filter((w) => w.length >= min && w.length <= max);
  return sample(pool.length ? pool : WORDS);
}

export default function BrailleHangman() {
  const { difficulty, setDifficulty, stats, finish } = useSession('hangman');
  const { announce, region } = useAnnouncer();
  const [phase, setPhase] = useState<Phase>('start');
  const [word, setWord] = useState('');
  const [guessed, setGuessed] = useState<string[]>([]);
  const [result, setResult] = useState<{
    won: boolean;
    score: number;
    best: number;
    isNewBest: boolean;
    tip: string;
  } | null>(null);

  const { maxWrong } = levelParams(difficulty);
  const wrong = guessed.filter((l) => !word.includes(l));
  const left = maxWrong - wrong.length;

  const start = useCallback(() => {
    const w = pickWord(difficulty);
    setWord(w);
    setGuessed([]);
    setResult(null);
    setPhase('play');
    announce(
      `A ${w.length}-letter word is shown in braille. Read the cells, then type a letter to guess. ${levelParams(difficulty).maxWrong} wrong guesses allowed.`,
    );
  }, [announce, difficulty]);

  const guess = useCallback(
    (l: string) => {
      if (phase !== 'play' || guessed.includes(l)) {
        if (phase === 'play') announce(`You already tried ${l}.`);
        return;
      }
      const next = [...guessed, l];
      setGuessed(next);
      const hits = word.split('').filter((x) => x === l).length;
      const nowWrong = next.filter((x) => !word.includes(x)).length;
      const nowSolved = word.split('').every((x) => next.includes(x));
      const lost = nowWrong >= maxWrong;

      if (hits) {
        const where = word
          .split('')
          .map((x, i) => (x === l ? i + 1 : 0))
          .filter(Boolean)
          .join(' and ');
        announce(`Yes! ${l} is letter ${where}.`);
      } else {
        announce(`No ${l}. ${maxWrong - nowWrong} wrong ${maxWrong - nowWrong === 1 ? 'guess' : 'guesses'} left.`);
      }

      if (nowSolved || lost) {
        const score = nowSolved ? maxWrong - nowWrong : 0;
        const prevBest = stats.bestScore;
        finish(nowSolved, score);
        setResult({
          won: nowSolved,
          score,
          best: Math.max(prevBest, score),
          isNewBest: nowSolved && score > prevBest,
          tip: getRandomTip().fact,
        });
        setPhase('done');
      }
    },
    [announce, finish, guessed, maxWrong, phase, stats.bestScore, word],
  );

  useGameKeys((e) => {
    const onButton = e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement;
    if (phase === 'play') {
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        guess(e.key.toLowerCase());
      }
    } else if (e.key === 'Enter' && !onButton) {
      e.preventDefault();
      start();
    }
  });

  // Keep the word on screen behind the results so players can read it once more.
  const showWord = phase !== 'start' && word;

  return (
    <div className="game-board hang" data-testid="game-board">
      {region}

      {phase === 'start' && (
        <StartPanel heading="Read the word, guess the letters" onStart={start}>
          <p className="game-prompt-sub">
            The hidden word is shown in braille. Read the cells to spot it early — every wrong letter flattens a dot.
          </p>
          <ModePicker
            legend="Level"
            name="hang-level"
            value={difficulty}
            onChange={setDifficulty}
            options={LEVELS.map((d) => {
              const p = levelParams(d);
              return {
                value: d,
                label: DIFFICULTY_INFO[d].label,
                hint: `${p.min === p.max ? p.min : `${p.min}–${p.max}`} letters · ${p.maxWrong} misses`,
              };
            })}
          />
        </StartPanel>
      )}

      {phase === 'play' && (
        <div className="game-board-toolbar">
          <h2 className="hang-title">What is the word?</h2>
          <Hud
            items={[
              { label: 'Letters', value: word.length },
              { label: 'Misses left', value: left, tone: left <= 2 ? 'warn' : 'default' },
            ]}
          />
        </div>
      )}

      {showWord && (
        <ol className="hang-word" aria-label={`The word, ${word.length} letters`}>
          {word.split('').map((l, i) => {
            const shown = guessed.includes(l) || phase === 'done';
            return (
              <li key={i} className={`hang-slot${shown ? ' is-shown' : ''}`}>
                <Cell
                  dots={LETTERS[l]}
                  size="lg"
                  pop
                  label={shown ? `Letter ${i + 1}: ${l}` : `Letter ${i + 1}: braille cell`}
                />
                <span className="hang-slot-letter" aria-hidden="true">
                  {shown ? l : '?'}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {phase === 'play' && (
        <>
          <div className="hang-lives" role="img" aria-label={`${left} of ${maxWrong} misses left`}>
            {Array.from({ length: maxWrong }, (_, i) => (
              <span key={i} className={`hang-life${i < left ? ' is-raised' : ''}`} />
            ))}
          </div>
          {wrong.length > 0 && (
            <p className="hang-misses">
              Not in the word:{' '}
              {wrong.map((l) => (
                <span key={l} className="letter-chip">
                  {l}
                </span>
              ))}
            </p>
          )}

          <div className="hang-keyboard" role="group" aria-label="Letters">
            {KB_ROWS.map((row, r) => (
              <div key={r} className="hang-kb-row">
                {row.map((l) => {
                  const used = guessed.includes(l);
                  const hit = used && word.includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      className={`hang-key${used ? (hit ? ' is-hit' : ' is-miss') : ''}`}
                      aria-disabled={used || undefined}
                      aria-label={`${l}${used ? (hit ? ', in the word' : ', not in the word') : ''}`}
                      onClick={() => guess(l)}
                    >
                      <Cell dots={LETTERS[l]} size="xs" />
                      <span className="hang-key-letter">{l}</span>
                      {used && (
                        <span className="hang-key-mark" aria-hidden="true">
                          {hit ? '✓' : '✗'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {phase === 'done' && result && (
        <Results
          title={result.won ? 'You read it!' : 'Out of misses'}
          summary={
            result.won
              ? `“${word}” with ${maxWrong - result.score} ${maxWrong - result.score === 1 ? 'miss' : 'misses'}.`
              : `The word was “${word}” — ${word
                  .split('')
                  .map((l) => describe(LETTERS[l]))
                  .join(', then ')}.`
          }
          stars={result.won ? Math.min(3, Math.max(1, Math.ceil((result.score / maxWrong) * 3))) : 0}
          best={`${result.best} points`}
          isNewBest={result.isNewBest}
          onReplay={start}
          replayLabel="New word"
        >
          {result.tip && <p className="hang-tip">{result.tip}</p>}
        </Results>
      )}
    </div>
  );
}
