'use client';

import '@/styles/games/sentence-decoder.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Hud,
  ModePicker,
  Results,
  StartPanel,
  shuffle,
  useAnnouncer,
  useGameKeys,
  useSession,
} from '@/components/games/kit';
import Cell from '@/components/ui/Cell';
import data from '@/lib/data/ueb-contracted.json';
import { CONTRACTED_SENTENCES, type ContractedSentence } from '@/lib/games/contracted-content';
import { describeCells, fromUnicode } from '@/lib/ueb';
import type { Difficulty } from '@/lib/progress-types';

/** liblouis UEB grade 2 output, keyed by print text. U+2800 is a blank cell (a space). */
const BRAILLE = (data as { braille: Record<string, string> }).braille;
const BLANK = '⠀';

const ROUNDS = 5;

interface Word {
  print: string;
  cells: number[][];
}
interface Sentence {
  text: string;
  words: Word[];
}

const LEVEL_OF: Record<Difficulty, ContractedSentence['level']> = { beginner: 1, intermediate: 2, advanced: 3 };

const LEVELS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Level 1', hint: 'everyday wordsigns' },
  { value: 'intermediate', label: 'Level 2', hint: 'more contractions' },
  { value: 'advanced', label: 'Level 3', hint: 'longer sentences' },
];

/** Split the liblouis braille into words that line up with the print words. */
function buildSentence(s: ContractedSentence): Sentence {
  const unicode = BRAILLE[s.text];
  if (!unicode) throw new Error(`sentence-decoder: no liblouis braille for "${s.text}"`);
  const brailleWords = unicode.split(BLANK);
  const printWords = s.text.split(' ');
  return {
    text: s.text,
    words: brailleWords.map((w, i) => ({
      print: printWords.length === brailleWords.length ? printWords[i] : '',
      cells: Array.from(w).map((ch) => fromUnicode(ch)),
    })),
  };
}

/** Case-insensitive; ignores punctuation, apostrophes and extra spaces. */
export function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type Phase = 'ready' | 'question' | 'checked' | 'done';

/** Sentence Decoder: read a sentence in contracted (grade 2) UEB and type what it says. */
export default function BrailleSentenceDecoder() {
  const { difficulty, setDifficulty, stats, finish } = useSession('sentence-decoder');
  const { announce, region } = useAnnouncer();

  const [phase, setPhase] = useState<Phase>('ready');
  const [queue, setQueue] = useState<Sentence[]>([]);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const [revealed, setRevealed] = useState(0);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [newBest, setNewBest] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const sentence = queue[round];

  const start = useCallback(() => {
    const level = LEVEL_OF[difficulty];
    const picks = shuffle(CONTRACTED_SENTENCES.filter((s) => s.level === level)).slice(0, ROUNDS);
    setQueue(picks.map(buildSentence));
    setRound(0);
    setInput('');
    setRevealed(0);
    setScore(0);
    setHintsUsed(0);
    setNewBest(false);
    setPhase('question');
  }, [difficulty]);

  const hint = useCallback(() => {
    if (phase !== 'question' || !sentence || revealed >= sentence.words.length) return;
    const w = sentence.words[revealed];
    setRevealed(revealed + 1);
    setHintsUsed((h) => h + 1);
    announce(`Word ${revealed + 1} says “${w.print}”.`);
  }, [phase, sentence, revealed, announce]);

  const check = useCallback(
    (e?: { preventDefault(): void }) => {
      e?.preventDefault();
      if (phase !== 'question' || !sentence || !input.trim()) return;
      const ok = normalizeAnswer(input) === normalizeAnswer(sentence.text);
      setCorrect(ok);
      setPhase('checked');
      setRevealed(sentence.words.length);
      if (ok) {
        setScore((s) => s + 1);
        announce(`Correct! It says “${sentence.text}”.`);
      } else {
        announce(`Not quite. It says “${sentence.text}”.`);
      }
    },
    [phase, sentence, input, announce],
  );

  const next = useCallback(() => {
    if (phase !== 'checked') return;
    if (round + 1 >= queue.length) {
      setNewBest(score > stats.bestScore);
      finish(score >= Math.ceil(queue.length / 2), score);
      setPhase('done');
      return;
    }
    setRound(round + 1);
    setInput('');
    setRevealed(0);
    setPhase('question');
  }, [phase, round, queue.length, score, stats.bestScore, finish]);

  useEffect(() => {
    if (phase === 'question') inputRef.current?.focus({ preventScroll: true });
    if (phase === 'checked') nextRef.current?.focus();
  }, [phase, round]);

  useGameKeys(
    (e) => {
      if (e.target instanceof HTMLButtonElement) return;
      if (phase === 'ready' && e.key === 'Enter') {
        e.preventDefault();
        start();
      } else if (phase === 'question' && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        hint();
      } else if (phase === 'checked' && e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    },
    { enabled: phase !== 'done' },
  );

  const sentenceLabel = sentence
    ? 'Braille sentence. ' +
      sentence.words
        .map((w, i) => `Word ${i + 1}${i < revealed ? ` (${w.print})` : ''}: ${describeCells(w.cells)}`)
        .join('. ')
    : '';

  return (
    <div className="game-board sd-board" data-testid="game-board">
      {region}

      {phase === 'ready' && (
        <StartPanel heading="Ready to read some contracted braille?" onStart={start}>
          <p className="game-prompt-sub">
            Each sentence is written in contracted (grade 2) UEB. Read it and type what it says. Stuck? Ask for a hint
            to see one word at a time.
          </p>
          <ModePicker legend="Level" name="sd-level" value={difficulty} options={LEVELS} onChange={setDifficulty} />
        </StartPanel>
      )}

      {(phase === 'question' || phase === 'checked') && sentence && (
        <>
          <Hud
            items={[
              { label: 'Sentence', value: `${round + 1} of ${queue.length}` },
              { label: 'Score', value: score },
              { label: 'Hints', value: hintsUsed },
            ]}
          />
          <h2 className="game-prompt sd-prompt">What does it say?</h2>
          <div className="game-cell-stage sd-stage">
            <div className="sd-line" role="img" aria-label={sentenceLabel} data-testid="sd-sentence">
              {sentence.words.map((w, i) => (
                <span key={`${round}-${i}`} className={`sd-word${i < revealed ? ' is-revealed' : ''}`}>
                  <span className="sd-cells">
                    {w.cells.map((dots, k) => (
                      <Cell key={k} dots={dots} size="lg" />
                    ))}
                  </span>
                  <span className="sd-gloss">{i < revealed ? w.print : ' '}</span>
                </span>
              ))}
            </div>
          </div>

          <form className="sd-form" onSubmit={check}>
            <label className="sd-label" htmlFor="sd-answer">
              Type the sentence
            </label>
            <div className="sd-row">
              <input
                id="sd-answer"
                ref={inputRef}
                className={`input answer-input sd-input${phase === 'checked' ? (correct ? ' is-correct' : ' is-wrong') : ''}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') check(e);
                }}
                readOnly={phase === 'checked'}
                aria-invalid={phase === 'checked' && !correct ? true : undefined}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
              {phase === 'question' && (
                <button type="submit" className="btn btn--pine" disabled={!input.trim()}>
                  Check
                </button>
              )}
            </div>
          </form>

          {phase === 'question' && (
            <div className="sd-tools">
              <button
                type="button"
                className="btn btn--paper btn--sm"
                onClick={hint}
                disabled={revealed >= sentence.words.length}
              >
                Hint: show word {Math.min(revealed + 1, sentence.words.length)}
              </button>
              <span className="sd-tools-note">or press H outside the text box</span>
            </div>
          )}

          {phase === 'checked' && (
            <>
              <div className={`feedback ${correct ? 'feedback--good' : 'feedback--bad'}`} aria-hidden="true">
                <span className="feedback-pill">
                  {correct ? '✓ Correct!' : '✗ Not quite. It says:'} <strong>“{sentence.text}”</strong>
                </span>
              </div>
              <div className="sd-actions">
                <button ref={nextRef} type="button" className="btn btn--pine" onClick={next}>
                  {round + 1 >= queue.length ? 'See results' : 'Next sentence'}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {phase === 'done' && (
        <Results
          title={score === queue.length ? 'Perfect reading!' : score >= 3 ? 'Good decoding!' : 'Keep practicing!'}
          summary={`${score} of ${queue.length} sentences · ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'} used`}
          stars={score === queue.length && hintsUsed === 0 ? 3 : score >= 4 ? 2 : score >= 3 ? 1 : 0}
          best={Math.max(stats.bestScore, score) > 0 ? `${Math.max(stats.bestScore, score)} of ${ROUNDS}` : undefined}
          isNewBest={newBest}
          onReplay={start}
        />
      )}
    </div>
  );
}
