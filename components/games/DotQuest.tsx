'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Results, useAnnouncer, useSession, shuffle, pickDistractors, dotSimilarity } from '@/components/games/kit';
import { ALPHABET, LETTERS, type Dots } from '@/lib/ueb';
import { WORD_DECODER_LEVELS } from '@/lib/games/word-decoder-content';
import { getQuest, saveQuestStage } from '@/lib/progress-storage';
import type { QuestState } from '@/lib/progress-types';
import QuestMap from './dot-quest/QuestMap';
import PlayScreen, { type RunResult } from './dot-quest/PlayScreen';
import StickerBook, { IslandBadge, LetterSticker } from './dot-quest/StickerBook';
import '@/styles/games/dot-quest.css';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type ChallengeKind = 'tap-dot' | 'which-dot' | 'build' | 'find-cell' | 'name-cell' | 'read-word';

export interface Stage {
  id: string;
  /** 1-based position along the whole trail. */
  number: number;
  islandId: string;
  islandName: string;
  /** What the stop practises, read aloud in the stop's name: "letters a to e". */
  what: string;
  /** Five challenge kinds, in order. */
  kinds: ChallengeKind[];
  /** Dot numbers for the cell challenges (Dot Dock). */
  dots?: number[];
  /** New letters this stop focuses on. */
  letters?: string[];
  /** Older letters that may come back once for review. */
  review?: string[];
  /** Words for "Read the word". */
  words?: string[];
}

export type IslandTone = 'sand' | 'sea' | 'cliff' | 'jungle';

export interface Island {
  id: string;
  name: string;
  /** A real word shown in decorative braille on the island and its badge. */
  word: string;
  blurb: string;
  tone: IslandTone;
  stops: Stage[];
}

export interface Challenge {
  kind: ChallengeKind;
  /** Cell the learner must build, read or find. */
  target: Dots;
  dot?: number;
  letter?: string;
  word?: string;
  /** Choice ids in display order (choice kinds only). */
  choices?: string[];
  /** Correct choice id (choice kinds only). */
  answer?: string;
}

/* ── Stage data: 4 islands × 3 stops ───────────────────────────────────────── */

const range = (from: string, to: string) => ALPHABET.slice(ALPHABET.indexOf(from), ALPHABET.indexOf(to) + 1);

function levelWords(ids: string[], maxLen: number, minLen = 3): string[] {
  return WORD_DECODER_LEVELS.filter((l) => ids.includes(l.id))
    .flatMap((l) => l.items.map((i) => i.text))
    .filter((t) => /^[a-z]+$/.test(t) && t.length >= minLen && t.length <= maxLen);
}

type StopSpec = Omit<Stage, 'number' | 'islandId' | 'islandName'>;
type IslandSpec = Omit<Island, 'stops'> & { stops: StopSpec[] };

const ISLAND_SPECS: IslandSpec[] = [
  {
    id: 'dot-dock',
    name: 'Dot Dock',
    word: 'dock',
    blurb: 'Meet the six dots of the braille cell.',
    tone: 'sand',
    stops: [
      {
        id: 'dock-1',
        what: 'dots 1, 2 and 3',
        dots: [1, 2, 3],
        kinds: ['tap-dot', 'tap-dot', 'which-dot', 'tap-dot', 'which-dot'],
      },
      {
        id: 'dock-2',
        what: 'dots 4, 5 and 6',
        dots: [4, 5, 6],
        kinds: ['tap-dot', 'which-dot', 'tap-dot', 'which-dot', 'tap-dot'],
      },
      {
        id: 'dock-3',
        what: 'all six dots',
        dots: [1, 2, 3, 4, 5, 6],
        kinds: ['which-dot', 'tap-dot', 'which-dot', 'tap-dot', 'which-dot'],
      },
    ],
  },
  {
    id: 'shell-cove',
    name: 'Shell Cove',
    word: 'shell',
    blurb: 'Letters a to j live in the top four dots.',
    tone: 'sea',
    stops: [
      {
        id: 'cove-1',
        what: 'letters a to e',
        letters: range('a', 'e'),
        kinds: ['build', 'name-cell', 'find-cell', 'build', 'name-cell'],
      },
      {
        id: 'cove-2',
        what: 'letters f to j',
        letters: range('f', 'j'),
        kinds: ['name-cell', 'build', 'find-cell', 'name-cell', 'build'],
      },
      {
        id: 'cove-3',
        what: 'letters a to j',
        letters: range('a', 'j'),
        kinds: ['find-cell', 'build', 'name-cell', 'find-cell', 'build'],
      },
    ],
  },
  {
    id: 'kite-cliffs',
    name: 'Kite Cliffs',
    word: 'kite',
    blurb: 'Dot 3 joins the fun for letters k to t.',
    tone: 'cliff',
    stops: [
      {
        id: 'cliffs-1',
        what: 'letters k to o',
        letters: range('k', 'o'),
        review: range('a', 'j'),
        kinds: ['build', 'name-cell', 'find-cell', 'build', 'name-cell'],
      },
      {
        id: 'cliffs-2',
        what: 'letters p to t',
        letters: range('p', 't'),
        review: range('a', 'j'),
        kinds: ['name-cell', 'build', 'find-cell', 'name-cell', 'build'],
      },
      {
        id: 'cliffs-3',
        what: 'letters k to t',
        letters: range('k', 't'),
        review: range('a', 'j'),
        kinds: ['find-cell', 'build', 'name-cell', 'find-cell', 'build'],
      },
    ],
  },
  {
    id: 'zebra-jungle',
    name: 'Zebra Jungle',
    word: 'zebra',
    blurb: 'Letters u to z, then your very first words!',
    tone: 'jungle',
    stops: [
      {
        id: 'jungle-1',
        what: 'letters u to z',
        letters: range('u', 'z'),
        review: range('k', 't'),
        kinds: ['build', 'name-cell', 'find-cell', 'build', 'name-cell'],
      },
      {
        id: 'jungle-2',
        what: 'first words',
        letters: range('u', 'z'),
        words: levelWords(['a-j', 'a-t'], 3),
        kinds: ['read-word', 'build', 'read-word', 'name-cell', 'read-word'],
      },
      {
        id: 'jungle-3',
        what: 'more words',
        letters: range('u', 'z'),
        words: levelWords(['a-t', 'a-z'], 4),
        kinds: ['read-word', 'find-cell', 'read-word', 'build', 'read-word'],
      },
    ],
  },
];

let stopNumber = 0;
export const ISLANDS: Island[] = ISLAND_SPECS.map((island) => ({
  ...island,
  stops: island.stops.map((s) => ({ ...s, number: ++stopNumber, islandId: island.id, islandName: island.name })),
}));

export const STAGES: Stage[] = ISLANDS.flatMap((i) => i.stops);

/* ── Challenge generation (only ever called from event handlers) ───────────── */

/** Draws from a shuffled bag, refilling it when empty, never the same item twice in a row. */
function bag<T>(items: readonly T[]) {
  let pile: T[] = [];
  let last: T | undefined;
  return () => {
    if (pile.length === 0) {
      pile = shuffle(items);
      if (pile.length > 1 && pile[0] === last) pile.push(pile.shift() as T);
    }
    last = pile.shift() as T;
    return last;
  };
}

const letterSimilarity = (a: string, b: string) => dotSimilarity(LETTERS[a], LETTERS[b]);

export function generateChallenges(stage: Stage): Challenge[] {
  const nextDot = bag(stage.dots ?? []);
  const nextLetter = bag(stage.letters ?? []);
  const nextWord = bag(stage.words ?? []);
  const letterSlots = stage.kinds
    .map((k, i) => (['build', 'find-cell', 'name-cell'].includes(k) ? i : -1))
    .filter((i) => i > 0);
  const reviewSlot = stage.review?.length ? letterSlots[Math.floor(Math.random() * letterSlots.length)] : -1;

  return stage.kinds.map((kind, i): Challenge => {
    if (kind === 'tap-dot' || kind === 'which-dot') {
      const dot = nextDot();
      if (kind === 'tap-dot') return { kind, dot, target: [dot] };
      const pool = stage.dots ?? [];
      const others = shuffle(pool.filter((d) => d !== dot)).slice(0, 3);
      const choices = [dot, ...others].sort((a, b) => a - b).map(String);
      return { kind, dot, target: [dot], choices, answer: String(dot) };
    }
    if (kind === 'read-word') {
      const word = nextWord();
      const pool = stage.words ?? [];
      const sameLength = pool.filter((w) => w !== word && w.length === word.length);
      const others = shuffle(sameLength.length >= 2 ? sameLength : pool.filter((w) => w !== word)).slice(0, 2);
      return { kind, word, target: [], choices: shuffle([word, ...others]), answer: word };
    }
    const fromReview = i === reviewSlot && stage.review;
    const letter = fromReview ? stage.review![Math.floor(Math.random() * stage.review!.length)] : nextLetter();
    const target = LETTERS[letter];
    if (kind === 'build') return { kind, letter, target };
    const letterPool = [
      ...(stage.letters ?? []),
      ...(fromReview || (stage.letters?.length ?? 0) < 4 ? (stage.review ?? []) : []),
    ];
    const choices = shuffle([letter, ...pickDistractors(letter, letterPool, 3, letterSimilarity)]);
    return { kind, letter, target, choices, answer: letter };
  });
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

const UNLOCK_KEY = 'dotQuest_unlockAll';

function readQuest(): QuestState {
  const q = getQuest();
  return { stars: { ...q.stars }, stickers: [...q.stickers] };
}

function starsFor(misses: number) {
  return misses === 0 ? 3 : misses <= 2 ? 2 : 1;
}

type View =
  | { name: 'map' }
  | { name: 'book' }
  | { name: 'play'; stage: Stage; challenges: Challenge[]; run: number }
  | { name: 'results'; stage: Stage; stars: number; firstTry: number; fresh: string[] };

/* ── The game ──────────────────────────────────────────────────────────────── */

export default function DotQuest() {
  const { answer, finish } = useSession('dot-quest');
  const { announce, region } = useAnnouncer();
  const [quest, setQuest] = useState<QuestState>({ stars: {}, stickers: [] });
  const [unlockAll, setUnlockAll] = useState(false);
  const [view, setView] = useState<View>({ name: 'map' });
  const [note, setNote] = useState<string | null>(null);
  const runCount = useRef(0);
  /** Element id to focus when the map comes back (the button that left it). */
  const returnFocus = useRef<string | null>(null);

  useEffect(() => {
    setQuest(readQuest());
    try {
      setUnlockAll(window.localStorage.getItem(UNLOCK_KEY) === '1');
    } catch {
      // storage blocked: the toggle simply starts off
    }
  }, []);

  useEffect(() => {
    if (view.name !== 'map' || !returnFocus.current) return;
    document.getElementById(returnFocus.current)?.focus();
    returnFocus.current = null;
  }, [view]);

  const changeUnlockAll = useCallback((on: boolean) => {
    setUnlockAll(on);
    setNote(null);
    try {
      window.localStorage.setItem(UNLOCK_KEY, on ? '1' : '0');
    } catch {
      // ignore
    }
  }, []);

  const start = useCallback((stage: Stage) => {
    setNote(null);
    runCount.current += 1;
    setView({ name: 'play', stage, challenges: generateChallenges(stage), run: runCount.current });
  }, []);

  const backToMap = useCallback((focusId: string) => {
    returnFocus.current = focusId;
    setView({ name: 'map' });
  }, []);

  const onLocked = useCallback(
    (stage: Stage) => {
      const msg = `Stop ${stage.number} is still locked. Finish stop ${stage.number - 1} first!`;
      setNote(msg);
      announce(msg);
    },
    [announce],
  );

  const onFinish = useCallback(
    (stage: Stage, result: RunResult) => {
      const stars = starsFor(result.misses);
      const stickers = result.learned.map((l) => `letter:${l}`);
      const island = ISLANDS.find((i) => i.id === stage.islandId)!;
      const before = getQuest();
      if (island.stops.every((s) => s.id === stage.id || (before.stars[s.id] ?? 0) > 0)) {
        stickers.push(`island:${island.id}`);
      }
      const fresh = saveQuestStage(stage.id, stars, stickers);
      finish(true, stars * 10 + result.firstTry);
      setQuest(readQuest());
      announce(
        `Stop ${stage.number} finished! ${stars} of 3 stars.` +
          (fresh.length ? ` You got ${fresh.length} new sticker${fresh.length === 1 ? '' : 's'}!` : ''),
      );
      setView({ name: 'results', stage, stars, firstTry: result.firstTry, fresh });
    },
    [announce, finish],
  );

  return (
    <div className="game-board dq" data-testid="game-board">
      {region}

      {view.name === 'map' && (
        <QuestMap
          islands={ISLANDS}
          quest={quest}
          unlockAll={unlockAll}
          onUnlockAll={changeUnlockAll}
          onStart={start}
          onLocked={onLocked}
          onOpenBook={() => {
            setNote(null);
            setView({ name: 'book' });
          }}
          note={note}
        />
      )}

      {view.name === 'book' && (
        <StickerBook islands={ISLANDS} stickers={quest.stickers} onBack={() => backToMap('dq-book-btn')} />
      )}

      {view.name === 'play' && (
        <PlayScreen
          key={view.run}
          stage={view.stage}
          challenges={view.challenges}
          announce={announce}
          onAnswer={answer}
          onFinish={(r) => onFinish(view.stage, r)}
          onExit={() => backToMap(`dq-stop-${view.stage.id}`)}
        />
      )}

      {view.name === 'results' && (
        <StageResults
          view={view}
          onReplay={() => start(view.stage)}
          onNext={(s) => start(s)}
          onMap={() => backToMap(`dq-stop-${view.stage.id}`)}
        />
      )}
    </div>
  );
}

function StageResults({
  view,
  onReplay,
  onNext,
  onMap,
}: {
  view: Extract<View, { name: 'results' }>;
  onReplay: () => void;
  onNext: (s: Stage) => void;
  onMap: () => void;
}) {
  const { stage, stars, firstTry, fresh } = view;
  const next = STAGES[stage.number]; // number is 1-based, so this is the following stop
  const letters = fresh.filter((s) => s.startsWith('letter:')).map((s) => s.slice(7));
  const islands = fresh.filter((s) => s.startsWith('island:')).map((s) => ISLANDS.find((i) => `island:${i.id}` === s)!);
  const summary =
    stars === 3
      ? `Perfect! All ${firstTry} puzzles right on the first try.`
      : `You solved all 5 puzzles — ${firstTry} on the first try. Every try helps you learn!`;

  return (
    <div className="dq-results">
      <Results
        title={stars === 3 ? `Wow! Stop ${stage.number} done!` : `Hooray! Stop ${stage.number} done!`}
        summary={summary}
        stars={stars}
        onReplay={onReplay}
        replayLabel="Play this stop again"
      >
        {islands.map((island) => (
          <div key={island.id} className="dq-island-win">
            <p className="dq-island-win-text">You finished all of {island.name}!</p>
            <IslandBadge island={island} collected isNew />
          </div>
        ))}
        {letters.length > 0 && (
          <div className="dq-new-stickers">
            <h3 className="dq-new-title">New sticker{letters.length === 1 ? '' : 's'}!</h3>
            <ul className="dq-sticker-grid dq-sticker-grid--new">
              {letters.map((l, i) => (
                <li key={l}>
                  <LetterSticker letter={l} collected isNew index={i} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="cluster dq-results-nav">
          {next && (
            <button type="button" className="btn btn--pine btn--lg" onClick={() => onNext(next)}>
              Go to stop {next.number}
            </button>
          )}
          <button type="button" className="btn btn--paper btn--lg" onClick={onMap}>
            Back to the map
          </button>
        </div>
      </Results>
    </div>
  );
}
