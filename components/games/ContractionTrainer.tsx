'use client';

import '@/styles/games/contraction-trainer.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cell from '@/components/ui/Cell';
import {
  Choices,
  Hud,
  ModePicker,
  Results,
  StartPanel,
  dotSimilarity,
  pickDistractors,
  shuffle,
  useAnnouncer,
  useGameKeys,
  useSession,
  type Choice,
} from '@/components/games/kit';
import {
  CONTRACTIONS,
  KIND_LABELS,
  describe,
  fromUnicode,
  sameDots,
  type Contraction,
  type ContractionKind,
  type Dots,
} from '@/lib/ueb';
import { CONTRACTION_EXAMPLES } from '@/lib/games/contracted-content';
import contractedData from '@/lib/data/ueb-contracted.json';
import { itemStrength, weakestItems } from '@/lib/progress-storage';

const ROUND_SIZE = 10;
const WIN_AT = 7;
const MASTERED_AT = 0.6;
/** A missed card comes back this many cards later (or at the end of the round). */
const REVIEW_GAP = 3;

export type DeckId = 'first' | 'more' | 'all';
export type CardType = 'meaning' | 'cell';

const DECK_KINDS: Record<Exclude<DeckId, 'all'>, ContractionKind[]> = {
  first: ['alphabetic-wordsign', 'strong-contraction'],
  more: ['strong-groupsign', 'strong-wordsign', 'lower-wordsign'],
};

const DECK_INFO: Record<DeckId, { title: string; hint: string }> = {
  first: { title: 'First contractions', hint: 'Wordsigns + and, for, of, the, with' },
  more: { title: 'More contractions', hint: 'Groupsigns, strong and lower wordsigns' },
  all: { title: 'All of them', hint: 'Both decks, mixed' },
};

const DECK_NEXT: Record<DeckId, { href: string; label: string }> = {
  first: { href: '/learn/more-contractions', label: 'Next lesson: more contractions' },
  more: { href: '/games/sentence-decoder', label: 'Read them in Sentence Decoder' },
  all: { href: '/games/sentence-decoder', label: 'Read them in Sentence Decoder' },
};

const STANDALONE_KINDS = new Set<ContractionKind>([
  'alphabetic-wordsign',
  'strong-contraction',
  'strong-wordsign',
  'lower-wordsign',
]);

const BRAILLE = (contractedData as { braille: Record<string, string> }).braille;

/* ── Pure helpers (exported for tests) ─────────────────────────────────────── */

export function isDeckId(v: string | null | undefined): v is DeckId {
  return v === 'first' || v === 'more' || v === 'all';
}

export function buildDeck(id: DeckId): Contraction[] {
  const kinds = id === 'all' ? [...DECK_KINDS.first, ...DECK_KINDS.more] : DECK_KINDS[id];
  return CONTRACTIONS.filter((c) => kinds.includes(c.kind));
}

export const itemKey = (c: Contraction) => `contraction:${c.text}`;

export interface Question {
  card: Contraction;
  type: CardType;
  /** Four options, including the card. No two share a cell. */
  options: Contraction[];
  review: boolean;
}

/** Four options for a card: the answer plus three look-alikes, never two with the same cell. */
export function makeQuestion(
  card: Contraction,
  deck: readonly Contraction[],
  type: CardType,
  review = false,
): Question {
  const seen = new Set([card.dots.join('')]);
  const pool: Contraction[] = [];
  for (const c of shuffle(deck)) {
    const key = c.dots.join('');
    if (seen.has(key) || c.text === card.text) continue;
    seen.add(key);
    pool.push(c);
  }
  const distractors = pickDistractors(card, pool, 3, (a, b) => dotSimilarity(a.dots, b.dots));
  return { card, type, options: shuffle([card, ...distractors]), review };
}

/** The example phrase for a contraction in liblouis contracted braille, with the contraction's cells marked. */
export function exampleFor(c: Contraction): { sentence: string; cells: { dots: Dots; focus: boolean }[] } | null {
  const ex = CONTRACTION_EXAMPLES.find((e) => e.contraction === c.text && e.kind === c.kind);
  const braille = ex ? BRAILLE[ex.sentence] : undefined;
  if (!ex || !braille) return null;
  const brailleWords = braille.split('⠀');
  const printWords = ex.sentence.split(' ');
  const target =
    STANDALONE_KINDS.has(c.kind) && brailleWords.length === printWords.length
      ? printWords.findIndex((w) => w.toLowerCase().replace(/[^a-z]/g, '') === c.text)
      : -1;
  const cells: { dots: Dots; focus: boolean }[] = [];
  brailleWords.forEach((word, wi) => {
    if (wi > 0) cells.push({ dots: [], focus: false });
    for (const ch of word) {
      const dots = fromUnicode(ch);
      const inScope = STANDALONE_KINDS.has(c.kind) ? wi === target : true;
      cells.push({ dots, focus: inScope && sameDots(dots, c.dots) });
    }
  });
  return { sentence: ex.sentence, cells };
}

function starsFor(correct: number): number {
  if (correct >= 9) return 3;
  if (correct >= WIN_AT) return 2;
  if (correct >= 4) return 1;
  return 0;
}

function countMastered(deck: readonly Contraction[]): number {
  return deck.filter((c) => itemStrength(itemKey(c)) >= MASTERED_AT).length;
}

/* ── Component ─────────────────────────────────────────────────────────────── */

interface QueueEntry {
  card: Contraction;
  review: boolean;
}

export default function ContractionTrainer() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramDeck = searchParams?.get('deck') ?? null;
  const { answer, finish } = useSession('contraction-trainer');
  const { announce, region } = useAnnouncer();

  const [deckId, setDeckId] = useState<DeckId>(() => (isDeckId(paramDeck) ? paramDeck : 'first'));
  const [phase, setPhase] = useState<'start' | 'play' | 'results'>('start');
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [pos, setPos] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [firstCorrect, setFirstCorrect] = useState(0);
  const [firstSeen, setFirstSeen] = useState(0);
  const [missed, setMissed] = useState<Contraction[]>([]);
  const [requeued, setRequeued] = useState<Set<string>>(() => new Set());
  const [mastered, setMastered] = useState(0);

  const nextRef = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);

  const deck = buildDeck(deckId);
  const answered = picked !== null;

  useEffect(() => {
    if (isDeckId(paramDeck)) {
      setDeckId(paramDeck);
      setPhase('start');
    }
  }, [paramDeck]);

  // Mastery reads localStorage: only after mount, and after each answer.
  useEffect(() => {
    setMastered(countMastered(buildDeck(deckId)));
  }, [deckId, picked, phase]);

  const chooseDeck = (id: DeckId) => {
    setDeckId(id);
    try {
      router.replace(`/games/contraction-trainer?deck=${id}`, { scroll: false });
    } catch {
      /* navigation is a nicety */
    }
  };

  const start = useCallback(() => {
    const d = buildDeck(deckId);
    const byKey = new Map(d.map((c) => [itemKey(c), c]));
    // Weakest (and unseen) cards first; shuffling first breaks ties randomly.
    const keys = weakestItems(shuffle([...byKey.keys()]), ROUND_SIZE);
    const cards = shuffle(keys.map((k) => byKey.get(k)!));
    const q = cards.map((card) => ({ card, review: false }));
    setQueue(q);
    setPos(0);
    setQuestion(makeQuestion(q[0].card, d, 'meaning'));
    setPicked(null);
    setFirstCorrect(0);
    setFirstSeen(0);
    setMissed([]);
    setRequeued(new Set());
    setPhase('play');
    announce(`${DECK_INFO[deckId].title}. Card 1 of ${ROUND_SIZE}.`);
  }, [deckId, announce]);

  // Each new card: focus its question so screen readers read it. After answering: focus "Next card".
  useEffect(() => {
    if (phase !== 'play') return;
    if (answered) nextRef.current?.focus();
    else promptRef.current?.focus();
  }, [phase, pos, answered]);

  const pick = (id: string) => {
    if (!question || answered) return;
    const { card, review } = question;
    const correct = id === card.text;
    setPicked(id);
    answer(itemKey(card), correct);
    if (!review) {
      setFirstSeen((n) => n + 1);
      if (correct) setFirstCorrect((n) => n + 1);
      else setMissed((m) => [...m, card]);
    }
    let comingBack = false;
    if (!correct && !requeued.has(card.text)) {
      comingBack = true;
      setRequeued((s) => new Set(s).add(card.text));
      setQueue((q) => {
        const copy = [...q];
        copy.splice(Math.min(pos + REVIEW_GAP, copy.length), 0, { card, review: true });
        return copy;
      });
    }
    const meaning = `${KIND_LABELS[card.kind].toLowerCase()} “${card.text}” is ${describe(card.dots)}`;
    const msg = correct
      ? `Yes! The ${meaning}.`
      : `Not this time. The ${meaning}.${comingBack ? ' This card will come back later in the round.' : ''}`;
    announce(msg);
  };

  const next = useCallback(() => {
    if (phase !== 'play' || !answered) return;
    const n = pos + 1;
    if (n >= queue.length) {
      finish(firstCorrect >= WIN_AT, firstCorrect * 10);
      setPhase('results');
      return;
    }
    setPos(n);
    setPicked(null);
    setQuestion(makeQuestion(queue[n].card, deck, n % 2 === 0 ? 'meaning' : 'cell', queue[n].review));
    const label = queue[n].review ? 'Review card.' : `Card ${firstSeen + 1} of ${ROUND_SIZE}.`;
    announce(label);
  }, [phase, answered, pos, queue, deck, firstCorrect, firstSeen, finish, announce]);

  useGameKeys((e) => {
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement) return;
    if (phase === 'start' && e.key === 'Enter') {
      e.preventDefault();
      start();
    } else if (phase === 'play' && answered && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      next();
    }
  });

  const meter = (
    <div className="meter ct-mastery">
      <span className="meter-label" id="ct-mastery-label">
        Deck mastery
      </span>
      <div
        className="meter-track"
        role="progressbar"
        aria-labelledby="ct-mastery-label"
        aria-valuemin={0}
        aria-valuemax={deck.length}
        aria-valuenow={mastered}
        aria-valuetext={`${mastered} of ${deck.length} cards mastered`}
      >
        <div className="meter-fill" style={{ width: `${(mastered / deck.length) * 100}%` }} />
      </div>
      <span className="meter-label" aria-hidden="true">
        {mastered} / {deck.length}
      </span>
    </div>
  );

  /* ── Start ── */
  if (phase === 'start') {
    return (
      <div className="game-board" data-testid="game-board">
        {region}
        <StartPanel heading="Learn the shortcuts of real braille" onStart={start} startLabel="Start 10 cards">
          <p className="game-prompt-sub ct-intro">
            Contractions are the shortcuts that make braille quick to read. Each card shows a cell or a word — pick its
            match. Cards you find tricky come back sooner.
          </p>
          <ModePicker
            legend="Choose a deck"
            name="ct-deck"
            value={deckId}
            onChange={chooseDeck}
            options={(['first', 'more', 'all'] as const).map((id) => ({
              value: id,
              label: `${DECK_INFO[id].title} (${buildDeck(id).length})`,
              hint: DECK_INFO[id].hint,
            }))}
          />
          {meter}
        </StartPanel>
      </div>
    );
  }

  /* ── Results ── */
  if (phase === 'results') {
    const won = firstCorrect >= WIN_AT;
    return (
      <div className="game-board" data-testid="game-board">
        {region}
        <Results
          title={won ? 'Your braille is getting faster!' : 'Good practice!'}
          summary={`${firstCorrect} of ${ROUND_SIZE} right the first time`}
          stars={starsFor(firstCorrect)}
          onReplay={start}
          replayLabel="Another 10 cards"
          next={DECK_NEXT[deckId]}
        >
          {meter}
          {missed.length > 0 && (
            <div className="ct-missed">
              <h3>Worth another look</h3>
              <ul>
                {missed.map((c) => (
                  <li key={`${c.text}-${c.kind}`}>
                    <Cell dots={c.dots} size="sm" framed />
                    <span>
                      <strong>{c.text}</strong> <span className="ct-missed-dots">{describe(c.dots)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Results>
      </div>
    );
  }

  /* ── Play ── */
  if (!question) return null;
  const { card, type, options, review } = question;
  const correctPick = picked === card.text;
  const choices: Choice[] = options.map((o) =>
    type === 'meaning'
      ? { id: o.text, content: o.text }
      : {
          id: o.text,
          content: <Cell dots={o.dots} size="lg" />,
          label: describe(o.dots),
        },
  );
  const example = answered ? exampleFor(card) : null;

  return (
    <div className="game-board ct-board" data-testid="game-board" data-card={card.text} data-card-type={type}>
      {region}
      <div className="game-board-toolbar">
        <h2 className="ct-deck-heading">{DECK_INFO[deckId].title}</h2>
        <Hud
          items={[
            {
              label: 'Card',
              value: `${Math.min(firstSeen + (answered || review ? 0 : 1), ROUND_SIZE)} / ${ROUND_SIZE}`,
            },
            { label: 'Right first time', value: firstCorrect, tone: 'streak' },
          ]}
        />
      </div>
      {meter}

      <div className="ct-card" key={pos}>
        {review && <span className="chip chip--plum ct-review">Review card</span>}
        {type === 'meaning' ? (
          <>
            <h3 className="game-prompt" ref={promptRef} tabIndex={-1}>
              What does this mean?
            </h3>
            <div className="game-cell-stage ct-stage">
              <Cell dots={card.dots} size="xl" framed pop label="Contraction cell" />
              <span className="chip chip--sky ct-kind">{KIND_LABELS[card.kind]}</span>
            </div>
          </>
        ) : (
          <>
            <h3 className="game-prompt" ref={promptRef} tabIndex={-1}>
              Which cell is <span className="ct-word">“{card.text}”</span>?
            </h3>
            <p className="ct-stage-sub">
              <span className="chip chip--sky ct-kind">{KIND_LABELS[card.kind]}</span>
            </p>
          </>
        )}

        <Choices
          choices={choices}
          onPick={pick}
          correctId={answered ? card.text : null}
          pickedId={picked}
          disabled={answered}
          label={type === 'meaning' ? 'Print meanings' : 'Braille cells'}
        />
      </div>

      {answered && (
        <div className={`ct-reveal ${correctPick ? 'is-good' : 'is-bad'}`}>
          <p className={`feedback ${correctPick ? 'feedback--good' : 'feedback--bad'}`}>
            <span className="feedback-pill">
              <span aria-hidden="true">{correctPick ? '✓ ' : '✗ '}</span>
              {correctPick ? 'Yes! ' : 'Not this time. '}
              <strong>{card.text}</strong> is {describe(card.dots)}.
              {!correctPick && requeued.has(card.text) && !review && ' It will come back later.'}
            </span>
          </p>
          <p className="ct-usage">
            <strong>{KIND_LABELS[card.kind]}:</strong> {card.usage}
          </p>
          {example && (
            <figure className="ct-example">
              <figcaption className="ct-example-eyebrow">In real braille</figcaption>
              <span className="ct-example-run" aria-hidden="true">
                {example.cells.map((c, i) =>
                  c.dots.length === 0 ? (
                    <span key={i} className="ct-example-space" />
                  ) : (
                    <span key={i} className={`ct-example-cell${c.focus ? ' is-focus' : ''}`}>
                      <Cell dots={c.dots} size="md" tone={c.focus ? 'pine' : 'tomato'} pop />
                    </span>
                  ),
                )}
              </span>
              <p className="ct-example-print">{example.sentence}</p>
              <p className="sr-only">
                In contracted braille, “{card.text}” in this phrase is written {describe(card.dots)}.
              </p>
            </figure>
          )}
          <div className="ct-next">
            <button type="button" className="btn btn--lg" ref={nextRef} onClick={next}>
              {pos + 1 >= queue.length ? 'See my results' : 'Next card'}
            </button>
            <span className="ct-next-hint" aria-hidden="true">
              or press Space
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
