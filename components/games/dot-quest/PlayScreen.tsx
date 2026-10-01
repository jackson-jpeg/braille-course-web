'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Choices, DotPad, Hud, sample, useGameKeys, type Choice } from '@/components/games/kit';
import Cell from '@/components/ui/Cell';
import BrailleText from '@/components/ui/BrailleText';
import { LETTERS, describe, describeCells, sameDots, transcribe } from '@/lib/ueb';
import type { Challenge, Stage } from '../DotQuest';
import Mascot from './Mascot';

export interface RunResult {
  misses: number;
  /** Puzzles solved without a miss. */
  firstTry: number;
  /** Letters built or read correctly this run (each earns a sticker). */
  learned: string[];
}

interface PlayScreenProps {
  stage: Stage;
  challenges: Challenge[];
  announce: (text: string) => void;
  onAnswer: (itemKey: string, correct: boolean) => void;
  onFinish: (result: RunResult) => void;
  onExit: () => void;
}

type Phase = 'ask' | 'right' | 'oops';
type Mark = 'correct' | 'missing' | 'extra';

/** Where each dot sits, in words a 6-year-old (or a screen reader) can follow. */
const SPOT: Record<number, string> = {
  1: 'top left',
  2: 'middle left',
  3: 'bottom left',
  4: 'top right',
  5: 'middle right',
  6: 'bottom right',
};

const CHEERS = ['Yes!', 'You got it!', 'Hooray!', 'Super!', 'Nice work!', 'Wow!'];

const isPadKind = (c: Challenge) => c.kind === 'tap-dot' || c.kind === 'build';

function promptFor(c: Challenge): ReactNode {
  switch (c.kind) {
    case 'tap-dot':
      return (
        <>
          Tap dot <span className="dq-token">{c.dot}</span>
        </>
      );
    case 'which-dot':
      return 'Which dot is lit?';
    case 'build':
      return (
        <>
          Build the letter <span className="dq-token">{c.letter}</span>
        </>
      );
    case 'find-cell':
      return (
        <>
          Find the cell for <span className="dq-token">{c.letter}</span>
        </>
      );
    case 'name-cell':
      return 'What letter is this?';
    case 'read-word':
      return 'Read the word';
  }
}

function hintFor(c: Challenge): string {
  switch (c.kind) {
    case 'tap-dot':
    case 'which-dot':
      return 'Dots 1, 2, 3 go down the left side. Dots 4, 5, 6 go down the right side.';
    case 'build':
      return `Tap the dots for ${c.letter}, then press Check. Not sure? Press Check and we will look together.`;
    case 'find-cell':
      return 'Look closely at each cell. Where are the dots?';
    case 'name-cell':
      return 'Look at where the dots are. Which letter has them?';
    case 'read-word':
      return 'Read one cell at a time, from left to right.';
  }
}

/** The right answer, described in words (used when we "look together"). */
function answerText(c: Challenge): string {
  switch (c.kind) {
    case 'tap-dot':
    case 'which-dot':
      return `Dot ${c.dot} is the ${SPOT[c.dot!]} dot.`;
    case 'read-word':
      return `This word is ${c.word}: ${c.word!.split('').join(', ')}.`;
    default:
      return `The letter ${c.letter} is ${describe(c.target)}.`;
  }
}

function choicesFor(c: Challenge): Choice[] {
  return (c.choices ?? []).map((id) => {
    switch (c.kind) {
      case 'which-dot':
        return { id, content: <span data-choice-id={id}>Dot {id}</span> };
      case 'find-cell':
        return {
          id,
          label: describe(LETTERS[id]),
          content: (
            <span data-choice-id={id} className="dq-choice-cell">
              <Cell dots={LETTERS[id]} size="lg" />
            </span>
          ),
        };
      case 'read-word':
        return {
          id,
          content: (
            <span data-choice-id={id} className="dq-choice-word">
              {id}
            </span>
          ),
        };
      default:
        return {
          id,
          content: (
            <span data-choice-id={id} className="dq-choice-letter">
              {id}
            </span>
          ),
        };
    }
  });
}

/** Five puzzles, one at a time. Misses are gentle and never end the stop. */
export default function PlayScreen({ stage, challenges, announce, onAnswer, onFinish, onExit }: PlayScreenProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('ask');
  const [value, setValue] = useState<number[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [said, setSaid] = useState<{ title: string; detail?: string } | null>(null);
  const tally = useRef({ misses: 0, firstTry: 0, learned: [] as string[], missedThis: false });
  const promptRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const c = challenges[index];
  const last = index === challenges.length - 1;
  const pad = isPadKind(c);

  // A new puzzle: move focus to its question so screen readers read it and keyboard focus is never lost.
  useEffect(() => promptRef.current?.focus(), [index]);
  useEffect(() => {
    if (phase === 'right') nextRef.current?.focus();
  }, [phase]);

  const next = () => {
    if (last) {
      const t = tally.current;
      onFinish({ misses: t.misses, firstTry: t.firstTry, learned: [...t.learned] });
      return;
    }
    tally.current.missedThis = false;
    setIndex((i) => i + 1);
    setPhase('ask');
    setValue([]);
    setPicked(null);
    setSaid(null);
  };

  // Enter (or the right arrow) moves on after a right answer. A focused button handles its own Enter.
  useGameKeys(
    (e) => {
      if (e.defaultPrevented || e.target instanceof HTMLButtonElement) return;
      if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      }
    },
    { enabled: phase === 'right' },
  );

  const correct = (detail: string) => {
    const t = tally.current;
    if (!t.missedThis) t.firstTry++;
    if (c.letter) {
      onAnswer(`letter:${c.letter}`, true);
      if (!t.learned.includes(c.letter)) t.learned.push(c.letter);
    }
    const cheer = sample(CHEERS);
    setSaid({ title: cheer, detail });
    setPhase('right');
    announce(`${cheer} ${detail}`);
  };

  const miss = (detail: string) => {
    const t = tally.current;
    t.misses++;
    t.missedThis = true;
    if (c.letter) onAnswer(`letter:${c.letter}`, false);
    const title = 'Ooh, close! Let’s look together.';
    setSaid({ title, detail });
    setPhase('oops');
    announce(`Ooh, close! Let's look together. ${detail}`);
  };

  const check = () => {
    if (phase === 'right') return;
    if (value.length === 0) {
      const msg =
        c.kind === 'tap-dot' ? 'Tap a dot first, then press Check.' : 'Tap some dots first, then press Check.';
      setSaid({ title: 'Psst!', detail: msg });
      announce(msg);
      return;
    }
    if (sameDots(value, c.target)) {
      correct(
        c.kind === 'tap-dot'
          ? `That's dot ${c.dot}, the ${SPOT[c.dot!]} dot.`
          : `That's ${c.letter}: ${describe(c.target)}.`,
      );
    } else {
      miss(`You raised ${describe(value)}. ${answerText(c)} Fix the dots and press Check.`);
    }
  };

  const pick = (id: string) => {
    if (phase === 'right') return;
    setPicked(id);
    if (id === c.answer) {
      const detail =
        c.kind === 'which-dot'
          ? `It's dot ${c.dot}, the ${SPOT[c.dot!]} dot.`
          : c.kind === 'read-word'
            ? `The word is ${c.word}.`
            : `That's ${c.letter}: ${describe(c.target)}.`;
      correct(detail);
    } else {
      miss(`${answerText(c)} Try again!`);
    }
  };

  const marks: Partial<Record<number, Mark>> | undefined =
    phase === 'ask'
      ? undefined
      : Object.fromEntries(
          [1, 2, 3, 4, 5, 6].flatMap((d): [number, Mark][] => {
            const want = c.target.includes(d);
            const have = value.includes(d);
            if (want && have) return [[d, 'correct']];
            if (want) return [[d, 'missing']];
            if (have) return [[d, 'extra']];
            return [];
          }),
        );

  const wordCells = c.kind === 'read-word' ? transcribe(c.word!).map((cell) => cell.dots) : [];

  return (
    <div
      className={`dq-play dq-play--${phase}`}
      data-kind={c.kind}
      data-target-dots={pad ? c.target.join('') : undefined}
      data-answer={pad ? undefined : c.answer}
    >
      <div className="dq-play-top">
        <button type="button" className="btn btn--paper btn--sm" onClick={onExit}>
          Back to the map
        </button>
        <Hud
          items={[
            { label: 'Stop', value: stage.number },
            { label: 'Puzzle', value: `${index + 1} of ${challenges.length}` },
          ]}
        />
      </div>

      <h2 className="dq-play-title">
        Stop {stage.number}: {stage.islandName}
      </h2>

      <ol className="dq-pebbles" aria-hidden="true">
        {challenges.map((_, i) => (
          <li
            key={i}
            className={i < index || (i === index && phase === 'right') ? 'is-done' : i === index ? 'is-now' : ''}
          />
        ))}
      </ol>

      <div className="dq-question">
        <h3 ref={promptRef} tabIndex={-1} className="dq-prompt">
          <span className="sr-only">
            Puzzle {index + 1} of {challenges.length}:{' '}
          </span>
          {promptFor(c)}
        </h3>

        {c.kind === 'which-dot' && (
          <span
            className="dq-show"
            role="img"
            aria-label={`A braille cell with one raised dot, in the ${SPOT[c.dot!]} spot`}
          >
            <Cell dots={c.target} size="xl" framed pop key={index} />
          </span>
        )}
        {c.kind === 'name-cell' && (
          <span className="dq-show">
            <Cell dots={c.target} size="xl" framed pop label="Mystery cell" key={index} />
          </span>
        )}
        {c.kind === 'read-word' && (
          <span className="dq-show">
            <BrailleText
              cells={wordCells}
              size="lg"
              pop
              key={index}
              label={`Mystery word, ${wordCells.length} cells: ${describeCells(wordCells)}`}
            />
          </span>
        )}

        {pad ? (
          <DotPad
            value={value}
            onChange={setValue}
            onSubmit={check}
            disabled={phase === 'right'}
            marks={marks}
            label={c.kind === 'tap-dot' ? 'Your cell' : `Your cell for ${c.letter}`}
          />
        ) : (
          <Choices
            choices={choicesFor(c)}
            onPick={pick}
            correctId={phase === 'right' ? c.answer : null}
            pickedId={picked}
            disabled={phase === 'right'}
            typeToPick={c.kind === 'name-cell'}
            layout={c.kind === 'read-word' ? 'row' : 'grid'}
            label={c.kind === 'find-cell' ? 'Cells to choose from' : 'Answers'}
          />
        )}
      </div>

      <div className={`dq-talk dq-talk--${phase}`}>
        <Mascot mood={phase === 'right' ? 'happy' : phase === 'oops' ? 'oops' : 'think'} />
        <div className="dq-bubble">
          {said ? (
            <>
              <p className="dq-bubble-title">{said.title}</p>
              {said.detail && <p>{said.detail}</p>}
            </>
          ) : (
            <p>{hintFor(c)}</p>
          )}
          {phase === 'oops' && <LookTogether c={c} wordCells={wordCells} />}
        </div>
      </div>

      <div className="dq-actions">
        {phase === 'right' ? (
          <button ref={nextRef} type="button" className="btn btn--lg btn--pine dq-next" onClick={next}>
            {last ? 'See my stars!' : 'Next puzzle'}
          </button>
        ) : (
          pad && (
            <>
              <button type="button" className="btn btn--lg dq-check-btn" onClick={check}>
                Check
              </button>
              <button
                type="button"
                className="btn btn--paper"
                onClick={() => setValue([])}
                disabled={value.length === 0}
              >
                Clear
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
}

/** The right answer drawn as cells, so a miss turns into a mini lesson. Decorative: the text says it too. */
function LookTogether({ c, wordCells }: { c: Challenge; wordCells: (readonly number[])[] }) {
  if (c.kind === 'read-word') {
    return (
      <span className="dq-look" aria-hidden="true">
        {c.word!.split('').map((ch, i) => (
          <span key={i} className="dq-look-pair">
            <Cell dots={wordCells[i]} size="sm" tone="pine" framed />
            <span>{ch}</span>
          </span>
        ))}
      </span>
    );
  }
  return (
    <span className="dq-look" aria-hidden="true">
      <span className="dq-look-pair">
        <Cell dots={c.target} size="md" tone="pine" framed />
        <span>{c.letter ?? `dot ${c.dot}`}</span>
      </span>
    </span>
  );
}
